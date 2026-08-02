import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getLenis } from "./lenisSingleton";

export class ScrollManager {
  private static isRegistered = false;

  public static init() {
    if (typeof window !== "undefined" && !this.isRegistered) {
      gsap.registerPlugin(ScrollTrigger);
      this.isRegistered = true;
    }
  }

  public static createWalkthroughTrigger(
    triggerElement: HTMLElement,
    onStepChange: (index: number) => void,
    stepCount: number = 6
  ): any | null {
    this.init();
    if (typeof window === "undefined" || !triggerElement) return null;

    return ScrollTrigger.create({
      trigger: triggerElement,
      start: "top top",
      end: `+=${(stepCount - 1) * 100}%`,
      pin: true,
      scrub: true,
      onUpdate: (self) => {
        const progress = self.progress;
        // Divide progress space equally for steps
        const index = Math.max(0, Math.min(stepCount - 1, Math.floor(progress * stepCount)));
        onStepChange(index);
      },
    });
  }

  // Hands the actual scroll write off to Lenis (when it's mounted) instead of calling
  // window.scrollTo directly, which fights Lenis for control of scrollTop every frame.
  private static scrollWindowTo(targetScroll: number) {
    const lenis = getLenis();
    if (lenis) {
      lenis.scrollTo(targetScroll, { duration: 0.8, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
      return;
    }
    const currentScroll = window.scrollY;
    gsap.to(
      { val: currentScroll },
      {
        val: targetScroll,
        duration: 0.8,
        ease: "power2.out",
        onUpdate: function () {
          window.scrollTo(0, this.targets()[0].val);
        },
      }
    );
  }

  public static scrollToStep(
    trigger: any,
    stepIndex: number,
    stepCount: number = 6
  ) {
    if (!trigger) return;
    const start = trigger.start;
    const end = trigger.end;
    const totalDist = end - start;
    const progress = stepIndex / (stepCount - 1);
    const targetScroll = start + progress * totalDist;

    this.scrollWindowTo(targetScroll);
  }

  public static scrollToElement(elementId: string) {
    const id = elementId.startsWith("#") ? elementId.substring(1) : elementId;
    const element = document.getElementById(id);
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const targetScroll = window.scrollY + rect.top;

    this.scrollWindowTo(targetScroll);
  }
}
