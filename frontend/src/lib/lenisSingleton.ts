import type Lenis from "@studio-freight/lenis";

// Shared reference to the single Lenis instance created by SmoothScrollProvider, so other
// scroll-driving code (ScrollManager's GSAP tweens) can hand scroll position writes to Lenis
// instead of calling window.scrollTo directly and fighting Lenis for control of scrollTop.
let lenisInstance: Lenis | null = null;

export function setLenis(instance: Lenis | null) {
  lenisInstance = instance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}
