// Release history of the OpenSuperWhisper app (newest first). Drives the /changelog page and the
// "Latest update" block on the home page. Add a new entry at the top on each app release.
export interface ChangeEntry {
  version: string;
  date: string; // ISO yyyy-mm-dd
  title: string;
  summary: string;
}

export const CHANGELOG: ChangeEntry[] = [
  {
    version: "0.11.0",
    date: "2026-08-10",
    title: "Silence trimmed, every Whisper language, and punctuation it learns from you",
    summary:
      "Silence is cut out before Whisper sees the audio, so long pauses aren't transcribed and quiet stretches can't be turned into invented text. The language list held 22 of the 99 Whisper handles — Czech, Ukrainian and Vietnamese among the missing — and is now read from the transcriber itself. Text size finally reaches the dictation window, which is mostly graphics and so ignored a font-only setting. Translation is greyed out where it cannot work: turbo models return the source language unchanged, and every Whisper model on the setup screen is one. Also: recent transcriptions in the menu bar, a dictionary of badges, a prompt file, and a screen that learns how you say punctuation by having you read a few lines aloud.",
  },
  {
    version: "0.10.2",
    date: "2026-08-05",
    title: "The text size slider actually applies",
    summary:
      "One fix, for something 0.10.1 shipped broken. The slider wrote its value but nothing re-read it until the app was relaunched, so the control looked dead. Following the macOS text size always worked; only the app's own slider was affected.",
  },
  {
    version: "0.10.1",
    date: "2026-08-05",
    title: "Readable text, unlimited triggers, Space latch",
    summary:
      "Every text size in the app was fixed in code, so the size set in macOS did nothing here and the settings window was unreadable for anyone who needs it bigger. It now follows System Settings → Accessibility → Display, with its own slider on top. Recording triggers became unlimited and mixable: keyboard shortcuts, single modifiers and mouse buttons all at once. Reported by a user who wrote in to say she could barely read the settings window.",
  },
  {
    version: "0.10.0",
    date: "2026-07-31",
    title: "Local LLM cleanup, parallel recordings, composable indicator",
    summary:
      "The largest release since the fork. Recording and transcription are now independent: start the next dictation while the previous one is still working, and the text lands in the order you recorded. A small LLM runs in-process via llama.cpp, so cleanup and app-aware formatting need nothing installed and no server configured. The recording indicator is composable, built from the elements you choose.",
  },
  {
    version: "0.9.9",
    date: "2026-07-09",
    title: "The recording indicator is visible again on macOS 26",
    summary:
      "On macOS 26 the indicator and the Settings preview could stop appearing entirely. Dictation still worked, but nothing on screen said recording was live. The window was being created at zero size; it is sized correctly again in every position mode. Nothing changes on macOS 15 or earlier.",
  },
  {
    version: "0.9.8",
    date: "2026-07-07",
    title: "Mouse trigger, Esc confirmation & a RAM saver",
    summary:
      "Trigger recording with a mouse button (middle or a thumb button), alongside the keyboard modes. Esc now asks before cancelling a recording longer than ~10s, so an accidental tap won't lose a long dictation. New opt-in 'unload the Whisper model when idle' frees ~1GB of RAM between dictations. And files you drop to transcribe now show elapsed time next to the progress.",
  },
  {
    version: "0.9.7",
    date: "2026-07-07",
    title: "Recording indicator over full-screen apps",
    summary:
      "The recording indicator — including the notch pill and the live caption — now shows above full-screen apps. Dictate into a full-screen browser, video or editor and you'll still see that recording is live.",
  },
  {
    version: "0.9.6",
    date: "2026-07-06",
    title: "Esc cancels a recording",
    summary:
      "Press Esc to cancel a recording you started from the main window — it's discarded without transcribing, matching the floating bubble. And if the cancel shortcut ever got cleared, the app rebinds Esc automatically on launch.",
  },
  {
    version: "0.9.5",
    date: "2026-07-04",
    title: "Remote AI cleanup + short-dictation fixes",
    summary:
      "Optional AI cleanup of your transcriptions now works with any OpenAI-compatible server, not just Ollama — with the same Test Connection button and fetched model picker as the Remote transcription engine. Plus: very short dictations no longer come back empty (the live preview is kept as a fallback), and the notch no longer shows leftover text from the previous recording.",
  },
  {
    version: "0.9.4-beta.3",
    date: "2026-07-02",
    title: "Remote presets, smarter model list & recording-pill fixes",
    summary:
      "Save your Remote server configs as named presets (API key included, stored in the Keychain) and switch in one click. The model list now shows speech-to-text models by default with a search box for big catalogs. Plus the recording pill starts compact, fits the optional Stop/Cancel buttons, and centers its live caption.",
  },
  {
    version: "0.9.4-beta.1",
    date: "2026-07-02",
    title: "Remote engine, App Context & the community batch",
    summary:
      "The biggest update yet, largely contributed by the community: a Remote engine for any OpenAI-compatible server (Groq becomes a preset; optional local fallback when your server is unreachable), per-app/per-site model rules with a menu-bar picker, richer history (source app, site, model, rerun with another model), failed dictations kept with a retry button, lazy model loading, reliable media pause/resume — and the definitive fix for the macOS 26 crash after the first transcription. Beta: grab it from GitHub Releases.",
  },
  {
    version: "0.9.2",
    date: "2026-06-26",
    title: "Universal paste insertion",
    summary:
      "Transcriptions now insert reliably into every app — including Messages, Claude Code and other Electron/rich-text fields where direct typing silently failed. Insertion is back to a clipboard paste (⌘V) by default, made race-free and unconditional; switch back to typing in Settings if you'd rather keep your clipboard untouched.",
  },
  {
    version: "0.9.0",
    date: "2026-06-25",
    title: "Direct keyboard insertion",
    summary:
      "Transcriptions are now typed directly into the focused app instead of through the clipboard — fixing the bug where the previous clipboard could be pasted instead (notably in ChatGPT), with line breaks no longer submitting chat inputs. Plus a hotkey-freeze fix and a more reliable window reopen.",
  },
  {
    version: "0.8.0",
    date: "2026-06-23",
    title: "Redesigned Settings",
    summary:
      "Settings moved into a dedicated, movable window with a vertical sidebar, plus quick access from the menu-bar icon.",
  },
  {
    version: "0.7.0",
    date: "2026-06-23",
    title: "Groq engine + 4 languages",
    summary: "Added the Groq cloud engine for blazing-fast transcription, and broadened language coverage.",
  },
  {
    version: "0.6.0",
    date: "2026-06-23",
    title: "Command-line tool",
    summary: "A `transcribe` CLI command to script transcription, more accurate French, and a batch of fixes.",
  },
  {
    version: "0.5.0",
    date: "2026-06-22",
    title: "Intel support",
    summary: "OpenSuperWhisper now runs on Intel (x86_64) Macs, not just Apple Silicon.",
  },
  {
    version: "0.4.0",
    date: "2026-06-22",
    title: "SenseVoice engine",
    summary: "Added the on-device SenseVoice engine (Chinese, Cantonese, English, Japanese, Korean) plus quick wins.",
  },
  {
    version: "0.3.3",
    date: "2026-06-22",
    title: "Localized Settings + relaunch fix",
    summary: "Settings fully localized across the six interface languages, and fixed a relaunch glitch.",
  },
  {
    version: "0.3.2",
    date: "2026-06-22",
    title: "In-app language switcher",
    summary: "Switch the interface language on the fly, without leaving the app.",
  },
  {
    version: "0.3.1",
    date: "2026-06-22",
    title: "Auto-update + French",
    summary: "Sparkle auto-updates so you always have the latest, and a French interface.",
  },
];
