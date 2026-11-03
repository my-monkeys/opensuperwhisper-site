// Direct links to the latest release's disk images. The release attaches them under names
// without a version, next to the versioned files, so these links never go stale (see
// docs/RELEASING.md in the app repo).
const LATEST = "https://github.com/my-monkeys/OpenSuperWhisper/releases/latest";

export const RELEASE_PAGE = LATEST;
export const DMG_APPLE_SILICON = `${LATEST}/download/OpenSuperWhisper-arm64.dmg`;
export const DMG_INTEL = `${LATEST}/download/OpenSuperWhisper-x86_64.dmg`;
