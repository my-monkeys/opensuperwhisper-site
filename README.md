# opensuperwhisper.com

Marketing site for [OpenSuperWhisper](https://github.com/my-monkeys/OpenSuperWhisper) — the free,
open-source voice-dictation app for macOS. Astro + a React island for the model comparator.

## Develop

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/
```

## Model comparator

The comparator's numbers come from a real benchmark of every engine (Whisper, Parakeet, SenseVoice,
Groq) on [FLEURS](https://huggingface.co/datasets/google/fleurs) clips, measured on Apple Silicon via
the app's `bench` CLI. The pipeline lives in `benchmark/` (`bench.py` runs it, `merge-bench.py`
writes `src/data/benchmark.json`).

## Deploy

Static site deployed to `opensuperwhisper.com` via the My-Monkey **monkey** flow: build, then publish
a GitHub release with a tarball of this repo (the `.monkey` config targets the domain).
