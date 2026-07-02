#!/usr/bin/env python3
"""
OpenSuperWhisper model benchmark.

For each (model, language) it:
  - pulls a few FLEURS clips (audio + reference transcript),
  - sets the app's prefs to that engine/model + language,
  - runs `OpenSuperWhisper bench <dir>` (loads the model once, times each transcription),
  - scores accuracy: WER for Latin-script languages, CER for CJK.

Writes results.json consumed by the website's model comparator. Resumable: completed
(model, language) cells are cached in results.json and skipped on re-run.
"""
import json, os, subprocess, sys, time, unicodedata, re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLIPS = ROOT / "clips"
RESULTS = ROOT / "results.json"
BIN = Path.home() / "Documents/my-monkey/OpenSuperWhisper/build/Build/Products/Debug/OpenSuperWhisper.app/Contents/MacOS/OpenSuperWhisper"
BUNDLE = "fr.my-monkey.opensuperwhisper"
WMODELS = Path.home() / "Library/Application Support/ru.starmel.OpenSuperWhisper/whisper-models"

N_CLIPS = int(os.environ.get("N_CLIPS", "5"))
# FLEURS config code per language (subset; CJK flagged for CER scoring)
LANGS = {
    "en": "en_us", "fr": "fr_fr", "de": "de_de", "es": "es_419", "it": "it_it",
    "pt": "pt_br", "ru": "ru_ru", "vi": "vi_vn", "ar": "ar_eg", "hi": "hi_in",
    "zh": "cmn_hans_cn", "ja": "ja_jp", "ko": "ko_kr",
}
CJK = {"zh", "ja", "ko"}
_only = os.environ.get("ONLY_LANGS")
if _only:
    LANGS = {k: v for k, v in LANGS.items() if k in _only.split(",")}

# Models. `langs` = which UI languages this model can do (None = all in LANGS).
MODELS = [
    {"id": "whisper-tiny",       "label": "Whisper tiny",          "engine": "whisper",   "wmodel": "ggml-tiny.bin",          "device": "on-device", "langs": None},
    {"id": "whisper-base",       "label": "Whisper base",          "engine": "whisper",   "wmodel": "ggml-base.bin",          "device": "on-device", "langs": None},
    {"id": "whisper-small",      "label": "Whisper small",         "engine": "whisper",   "wmodel": "ggml-small.bin",         "device": "on-device", "langs": None},
    {"id": "whisper-medium",     "label": "Whisper medium",        "engine": "whisper",   "wmodel": "ggml-medium.bin",        "device": "on-device", "langs": None},
    {"id": "whisper-large-v3",   "label": "Whisper large-v3",      "engine": "whisper",   "wmodel": "ggml-large-v3.bin",      "device": "on-device", "langs": None},
    {"id": "whisper-turbo",      "label": "Whisper large-v3-turbo","engine": "whisper",   "wmodel": "ggml-large-v3-turbo.bin","device": "on-device", "langs": None},
    {"id": "distil-large-v3",    "label": "Distil large-v3",       "engine": "whisper",   "wmodel": "ggml-distil-large-v3.bin","device": "on-device", "langs": ["en"]},
    # System speech model (SpeechAnalyzer, macOS 26+). Langs = bench set ∩ SpeechTranscriber
    # supported locales on this machine (no ru/vi/ar as of Tahoe 27).
    {"id": "apple-speech",       "label": "Apple Speech",          "engine": "apple",                                          "device": "on-device", "langs": ["en","fr","de","es","it","pt","zh","ja","ko"]},  # hi dropped: outputs romanized Hindi, not comparable to FLEURS devanagari
    {"id": "parakeet-v3",        "label": "Parakeet v3",           "engine": "fluidaudio","fa": "v3",                          "device": "on-device", "langs": ["en","fr","de","es","it","pt","ru"]},
    {"id": "sensevoice",         "label": "SenseVoice",            "engine": "sensevoice",                                     "device": "on-device", "langs": ["zh","ja","ko","en"]},
    {"id": "moonshine-base",     "label": "Moonshine base",        "engine": "moonshine",                                      "device": "on-device", "langs": ["en","es","ar","ja","vi","zh"]},
    {"id": "groq-turbo",         "label": "Groq large-v3-turbo",   "engine": "groq",      "groq": "whisper-large-v3-turbo",    "device": "cloud",     "langs": None},
    {"id": "groq-large-v3",      "label": "Groq large-v3",         "engine": "groq",      "groq": "whisper-large-v3",          "device": "cloud",     "langs": None},
]

def sh(*a): subprocess.run(a, check=False, capture_output=True)
def defaults(key, val): sh("defaults", "write", BUNDLE, key, val)

MOON = Path.home() / "Library/Application Support/fr.my-monkey.opensuperwhisper/moonshine-models"
MOON_FILES = ["tokens.txt", "encoder_model.ort", "decoder_model_merged.ort"]

def ensure_moonshine(lang):
    """Download the Moonshine base model for `lang` (sherpa-onnx HF repo) if missing."""
    d = MOON / lang
    if all((d / f).exists() for f in MOON_FILES):
        return True
    d.mkdir(parents=True, exist_ok=True)
    repo = f"csukuangfj2/sherpa-onnx-moonshine-base-{lang}-quantized-2026-02-27"
    for f in MOON_FILES:
        url = f"https://huggingface.co/{repo}/resolve/main/{f}"
        if subprocess.run(["curl", "-sSL", "-f", url, "-o", str(d / f)]).returncode != 0:
            return False
    return True

def fetch_clips(ui_lang, cfg):
    """FLEURS test clips via the auto-converted Parquet (the loading-script API is gone). Download
    the test parquet once (curl, synchronous), then read the first N rows with pyarrow."""
    import pyarrow.parquet as pq, soundfile as sf
    d = CLIPS / ui_lang
    refs_path = d / "_refs.json"
    if refs_path.exists():
        return json.loads(refs_path.read_text())
    d.mkdir(parents=True, exist_ok=True)
    cache = ROOT / "pq_cache" / f"{cfg}_test.parquet"
    cache.parent.mkdir(exist_ok=True)
    if not cache.exists():
        api = f"https://datasets-server.huggingface.co/parquet?dataset=google/fleurs&config={cfg}"
        # curl (system certs) — the venv's Python lacks CA certs for urllib.
        info = json.loads(subprocess.run(["curl", "-sSL", api], capture_output=True, text=True).stdout)
        purl = next(f["url"] for f in info["parquet_files"] if f["split"] == "test")
        print(f"  downloading {cfg} parquet …", flush=True)
        subprocess.run(["curl", "-sSL", purl, "-o", str(cache)], check=True)
    batch = next(pq.ParquetFile(str(cache)).iter_batches(batch_size=N_CLIPS)).to_pylist()
    refs = []
    for i, row in enumerate(batch[:N_CLIPS]):
        p = d / f"{i}.wav"
        p.write_bytes(row["audio"]["bytes"])
        si = sf.info(str(p))
        ref = row.get("transcription") or row.get("raw_transcription")
        refs.append({"file": f"{i}.wav", "ref": ref, "dur": round(si.frames / si.samplerate, 3)})
    refs_path.write_text(json.dumps(refs, ensure_ascii=False))
    return refs

def normalize(s):
    s = unicodedata.normalize("NFKC", s).lower().strip()
    s = "".join(c for c in s if not unicodedata.category(c).startswith("P"))
    return re.sub(r"\s+", " ", s).strip()

def score(hyp, ref, ui_lang):
    import jiwer
    h, r = normalize(hyp), normalize(ref)
    if not r: return None
    if ui_lang in CJK:
        # CER standard: whitespace-free (the FLEURS zh reference space-separates every
        # character, which skewed CER for engines that don't emit spaced output).
        return jiwer.cer(r.replace(" ", ""), h.replace(" ", ""))
    return jiwer.wer(r, h)

def run_cell(model, ui_lang, cfg, refs):
    # configure prefs
    defaults("selectedEngine", model["engine"])
    defaults("whisperLanguage", ui_lang)
    if model["engine"] == "whisper":
        defaults("selectedWhisperModelPath", str(WMODELS / model["wmodel"]))
    if model["engine"] == "fluidaudio":
        defaults("fluidAudioModelVersion", model["fa"])
    if model["engine"] == "groq":
        defaults("groqModel", model["groq"])
        time.sleep(45)  # Groq free tier: let the per-minute rate limit reset between cells
    if model["engine"] == "moonshine":
        defaults("moonshineLanguage", ui_lang)
    if model["engine"] == "apple":
        # First use of a language makes the app pull the system speech assets
        # (AssetInventory) — run a throwaway transcribe first so the timed run
        # measures steady-state transcription only.
        first = sorted((CLIPS / ui_lang).glob("*.wav"))[0]
        subprocess.run([str(BIN), "transcribe", str(first)],
                       capture_output=True, timeout=1800)
    out = subprocess.run([str(BIN), "bench", str(CLIPS / ui_lang)],
                         capture_output=True, text=True, timeout=900)
    try:
        rows = json.loads(out.stdout.strip().splitlines()[-1])
    except Exception:
        return None
    by_file = {r["file"]: r for r in refs}
    errs, rtfs = [], []
    for row in rows:
        ref = by_file.get(row["file"])
        if not ref: continue
        e = score(row["text"], ref["ref"], ui_lang)
        if e is not None: errs.append(e)
        if ref["dur"] > 0: rtfs.append((row["ms"] / 1000.0) / ref["dur"])
    if not errs: return None
    errs.sort(); rtfs.sort()
    return {
        "err": round(sum(errs) / len(errs), 4),
        "metric": "cer" if ui_lang in CJK else "wer",
        "rtf": round(sum(rtfs) / len(rtfs), 4),
        "xrealtime": round(1 / (sum(rtfs) / len(rtfs)), 1) if rtfs else None,
        "n": len(errs),
    }

def main():
    results = json.loads(RESULTS.read_text()) if RESULTS.exists() else {"models": MODELS, "langs": list(LANGS), "cells": {}}
    cells = results["cells"]
    run_models = MODELS
    _om = os.environ.get("ONLY_MODELS")
    if _om:
        run_models = [m for m in MODELS if m["id"] in _om.split(",")]
    for model in run_models:
        # only languages present in the (possibly ONLY_LANGS-filtered) set
        targets = [l for l in (model["langs"] or list(LANGS)) if l in LANGS]
        for ui_lang in targets:
            key = f"{model['id']}::{ui_lang}"
            if key in cells:
                continue
            if model["engine"] == "whisper" and not (WMODELS / model["wmodel"]).exists():
                print(f"skip {key} (model not downloaded)", flush=True); continue
            if model["engine"] == "moonshine" and not ensure_moonshine(ui_lang):
                print(f"skip {key} (moonshine model unavailable)", flush=True); continue
            print(f"[{model['id']}] {ui_lang} …", flush=True, end=" ")
            try:
                refs = fetch_clips(ui_lang, LANGS[ui_lang])
                cell = run_cell(model, ui_lang, LANGS[ui_lang], refs)
            except Exception as e:
                print(f"FAIL ({e})", flush=True); cell = None
            cells[key] = cell
            print(json.dumps(cell), flush=True)
            results["models"] = MODELS
            RESULTS.write_text(json.dumps(results, ensure_ascii=False, indent=1))
    print("done →", RESULTS)

if __name__ == "__main__":
    main()
