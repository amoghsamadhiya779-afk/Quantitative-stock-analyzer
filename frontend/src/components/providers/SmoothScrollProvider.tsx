"use client";
import { useEffect } from "react";
import Lenis from "@studio-freight/lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { setLenis } from "@/lib/lenisSingleton";

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Expo ease out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });
    setLenis(lenis);

    // Keep GSAP's ScrollTrigger in sync with Lenis's virtual scroll position.
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's own ticker instead of a separate requestAnimationFrame loop,
    // so Lenis, GSAP and ScrollTrigger all advance on the same frame instead of racing
    // as independent rAF callbacks.
    const tickLenis = (time: number) => {
      lenis.raf(time * 1000); // gsap.ticker time is in seconds, Lenis expects ms
    };
    gsap.ticker.add(tickLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickLenis);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return <>{children}</>;
}
