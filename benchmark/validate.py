from datasets import load_dataset, Audio
import soundfile as sf, json, os
os.makedirs("clips", exist_ok=True)
print("streaming FLEURS fr_fr (test), decode=False…")
ds = load_dataset("google/fleurs", "fr_fr", split="test", streaming=True, trust_remote_code=True)
ds = ds.cast_column("audio", Audio(decode=False))
refs = []
for i, ex in enumerate(ds):
    if i >= 2: break
    path = f"clips/fr_{i}.wav"
    open(path, "wb").write(ex["audio"]["bytes"])
    info = sf.info(path)
    dur = info.frames / info.samplerate
    ref = ex.get("transcription") or ex.get("raw_transcription")
    refs.append({"path": path, "ref": ref, "dur": round(dur, 2)})
    print(f"  {path}  {dur:.1f}s  {info.samplerate}Hz  ref: {ref[:65]}…")
json.dump(refs, open("clips/_fr_refs.json", "w"), ensure_ascii=False)
print("✅ clips + refs OK")
