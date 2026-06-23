#!/usr/bin/env python3
"""results.json (per model×language cells) → src/data/benchmark.json consumed by the comparator.
Per model: an `overall` average + `byLang` measured speed/error, so the language filter shows
real per-language numbers."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent
results = json.loads((ROOT / "results.json").read_text())
# benchmark ids → site model ids (models.ts)
ID_MAP = {"whisper-large-v3": "whisper-large", "groq-large-v3": "groq-large"}

by_model = {}
for key, cell in results["cells"].items():
    if not cell:
        continue
    rid, lang = key.split("::")
    by_model.setdefault(ID_MAP.get(rid, rid), {})[lang] = cell

out = {}
for sid, langs in by_model.items():
    xrts = [c["xrealtime"] for c in langs.values() if c.get("xrealtime")]
    errs = [c["err"] for c in langs.values() if c.get("err") is not None]
    out[sid] = {
        "overall": {
            "xrt": round(sum(xrts) / len(xrts), 1) if xrts else None,
            "err": round(sum(errs) / len(errs) * 100, 1) if errs else None,
        },
        "byLang": {
            lang: {
                "xrt": c.get("xrealtime"),
                "err": round(c["err"] * 100, 1) if c.get("err") is not None else None,
                "metric": c.get("metric"),
            }
            for lang, c in langs.items()
        },
    }

dest = ROOT.parent / "src/data/benchmark.json"
dest.write_text(json.dumps(out, indent=1, ensure_ascii=False))
print(f"wrote {dest.name}: {len(out)} models — {', '.join(sorted(out))}")
