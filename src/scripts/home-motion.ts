import { gsap } from "gsap";

const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
const toggle = document.querySelector<HTMLButtonElement>(".motion-toggle");
const navigation = document.querySelector<HTMLElement>(".nav");
const updateFloatingNav = () => navigation?.classList.toggle("is-floating", window.scrollY > 48);
window.addEventListener("scroll", updateFloatingNav, { passive: true });
window.addEventListener("pageshow", updateFloatingNav);
updateFloatingNav();
let media = gsap.matchMedia();
let paused = false;
let introduced = false;

export const motionEnabled = () => !paused && !preference.matches && !document.hidden;

function setupMotion() {
  media.revert();
  media = gsap.matchMedia();
  const enabled = motionEnabled();
  document.body.dataset.motion = enabled ? "on" : "off";
  if (toggle) {
    toggle.textContent = preference.matches ? "Reduced motion" : paused ? "Play animations" : "Pause animations";
    toggle.setAttribute("aria-pressed", String(!enabled));
    toggle.disabled = preference.matches;
  }
  document.dispatchEvent(new Event("osw:motion-change"));
  if (!enabled) return;

  media.add("(prefers-reduced-motion: no-preference)", context => {
    if (!introduced) {
      gsap.from(".headline-line", { y: 65, rotation: -3, opacity: 0, duration: .9, stagger: .12, ease: "back.out(1.5)", clearProps: "all" });
      gsap.from(".hero-playground, .cc-stage", { y: 35, scale: .93, opacity: 0, duration: 1, ease: "back.out(1.3)", clearProps: "all" });
      if (document.querySelector(".cc-term-body")) {
        gsap.from(".cc-term-body > span", { opacity: 0, y: 5, duration: .35, stagger: .45, ease: "power1.out", clearProps: "all" });
        gsap.from(".cc-panel", { opacity: 0, y: 25, scale: .95, duration: .7, delay: 1.5, ease: "back.out(1.3)", clearProps: "all" });
      }
      introduced = true;
    }

    // Start reveals only when visible. Content remains available without JavaScript.
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        if (!motionEnabled()) return;
        context.add(() => {
          gsap.from(entry.target, { y: 28, opacity: .2, duration: .75, ease: "back.out(1.15)", clearProps: "all" });
        });
      });
    }, { threshold: .12 });
    document.querySelectorAll(".stat, main .h2, .shot-fig, .engine-card, .pv, .sh-card, .cc-shot, .cc-case, .cc-moment-copy").forEach(element => observer.observe(element));
    return () => observer.disconnect();
  });
}

toggle?.addEventListener("click", () => { paused = !paused; setupMotion(); });
preference.addEventListener("change", setupMotion);
document.addEventListener("visibilitychange", setupMotion);
setupMotion();

// Vite replaces this module during development; remove its observers on disposal.
if (import.meta.hot) import.meta.hot.dispose(() => {
  window.removeEventListener("scroll", updateFloatingNav);
  window.removeEventListener("pageshow", updateFloatingNav);
  media.revert();
  preference.removeEventListener("change", setupMotion);
  document.removeEventListener("visibilitychange", setupMotion);
});
