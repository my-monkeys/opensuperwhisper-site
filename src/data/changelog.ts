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
