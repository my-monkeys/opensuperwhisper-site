import { motionEnabled } from "./home-motion";

const cleanups: (() => void)[] = [];

document.querySelectorAll<HTMLElement>("[data-product-video]").forEach(root => {
  const video = root.querySelector<HTMLVideoElement>("video")!;
  const button = root.querySelector<HTMLButtonElement>("[data-video-toggle]")!;
  const title = root.querySelector("strong")!.textContent;
  let nearby = false;
  let visible = false;
  let loaded = false;
  let paused = false;
  let pending = false;
  let failed = false;

  function updateButton() {
    button.hidden = false;
    button.disabled = !motionEnabled() || failed;
    button.textContent = failed ? "Preview unavailable" : !motionEnabled() ? "Animations paused" : paused ? "Play video" : "Pause video";
    button.setAttribute("aria-label", `${button.textContent}: ${title}`);
  }

  function sync() {
    updateButton();
    if (!motionEnabled()) {
      video.pause();
      root.dataset.frame = "poster";
      return;
    }
    if (nearby && !loaded) {
      video.querySelectorAll<HTMLSourceElement>("source").forEach(source => { source.src = source.dataset.src!; });
      video.muted = true;
      video.load();
      loaded = true;
    }
    if (!visible || paused || failed) {
      video.pause();
      return;
    }
    if (!loaded || !video.paused || pending) return;
    pending = true;
    video.play().catch(error => {
      // Leaving the viewport can abort a pending play; that is not a playback failure.
      if (error.name !== "AbortError") { paused = true; updateButton(); }
    }).finally(() => { pending = false; sync(); });
  }

  const playing = () => {
    if (!visible || paused || !motionEnabled()) { video.pause(); return; }
    root.dataset.frame = "video";
  };
  const error = () => { failed = true; root.dataset.frame = "poster"; updateButton(); };
  const toggle = () => { paused = !paused; sync(); };
  const preloadObserver = new IntersectionObserver(([entry]) => { nearby = entry.isIntersecting; sync(); }, { rootMargin: "240px" });
  const playbackObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .2; sync(); }, { threshold: [0, .2] });
  video.addEventListener("playing", playing);
  video.addEventListener("error", error);
  button.addEventListener("click", toggle);
  document.addEventListener("osw:motion-change", sync);
  preloadObserver.observe(root);
  playbackObserver.observe(root);
  sync();

  cleanups.push(() => {
    video.pause();
    preloadObserver.disconnect();
    playbackObserver.disconnect();
    video.removeEventListener("playing", playing);
    video.removeEventListener("error", error);
    button.removeEventListener("click", toggle);
    document.removeEventListener("osw:motion-change", sync);
  });
});

if (import.meta.hot) import.meta.hot.dispose(() => cleanups.forEach(cleanup => cleanup()));
