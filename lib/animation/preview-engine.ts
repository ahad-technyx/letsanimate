"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { AnimationPlan, ScrollTriggerConfig } from "@/types/animation";
import { toGsapVars } from "./utils";

let scrollTriggerRegistered = false;
function ensureScrollTrigger() {
  if (!scrollTriggerRegistered && typeof window !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    scrollTriggerRegistered = true;
  }
}

export interface PreviewOptions {
  autoplay?: boolean;
  loop?: boolean;
  loopDelay?: number;
  respectReducedMotion?: boolean;
  scroller?: HTMLElement | null;
}

export interface PreviewHandle {
  play(): void;
  pause(): void;
  replay(): void;
  reset(): void;
  setSpeed(rate: number): void;
  setLoop(loop: boolean, delay?: number): void;
  isScrollDriven(): boolean;
  getTime(): number;
  getDuration(): number;
  isActive(): boolean;
  destroy(): void;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function defaultScrollConfig(): ScrollTriggerConfig {
  return { trigger: ".section", start: "top top", end: "+=600", scrub: true };
}

/**
 * Build a live GSAP animation from an AnimationPlan.
 *
 * - Selectors are scoped to `root` via gsap.context() — no bleed across previews.
 * - Every ScrollTrigger is created inside the same context, so ctx.revert()
 *   kills tweens AND their ScrollTriggers together. Idempotent.
 * - If `respectReducedMotion` is true and the user prefers reduced motion,
 *   we snap elements to their "to" state without animating.
 */
export function createPreview(
  root: HTMLElement,
  plan: AnimationPlan,
  opts: PreviewOptions = {},
): PreviewHandle {
  const respectReduced = opts.respectReducedMotion ?? plan.accessibility.respectReducedMotion;
  const reduced = respectReduced && prefersReducedMotion();

  const triggerType = plan.trigger.type;
  const isScrollDriven = triggerType === "onScroll" || triggerType === "onInView";
  if (isScrollDriven) ensureScrollTrigger();

  let timeline: gsap.core.Timeline | null = null;
  let destroyed = false;

  const ctx = gsap.context(() => {
    if (reduced) {
      // Skip animation — just apply the end state.
      plan.elements.forEach((el) => {
        gsap.set(el.selector, { ...(el.to ?? {}) });
      });
      return;
    }

    // Compose the timeline. For scroll-driven plans it's attached to a ScrollTrigger.
    let scrollTrigger: ScrollTrigger.Vars | undefined;
    if (triggerType === "onScroll") {
      const cfg = plan.trigger.scrollTrigger ?? defaultScrollConfig();
      scrollTrigger = {
        trigger: cfg.trigger,
        start: cfg.start ?? "top 80%",
        end: cfg.end ?? "bottom 20%",
        scrub: cfg.scrub ?? true,
        pin: cfg.pin ?? false,
        scroller: opts.scroller ?? undefined,
        invalidateOnRefresh: true,
      };
    } else if (triggerType === "onInView") {
      scrollTrigger = {
        trigger: plan.trigger.selector,
        start: "top 85%",
        toggleActions: "play none none reverse",
        scroller: opts.scroller ?? undefined,
        invalidateOnRefresh: true,
      };
    }

    timeline = gsap.timeline({
      defaults: { ease: plan.ease },
      paused: !isScrollDriven && !(opts.autoplay ?? true),
      scrollTrigger,
    });

    plan.elements.forEach((el) => {
      const [from, to] = toGsapVars(el, plan.ease);
      const position = el.timing.delay ?? 0;
      timeline!.fromTo(el.selector, from, to, position);
    });

    // Loop (non-scroll only — scroll-driven timelines are controlled by scroll).
    if (!isScrollDriven && (opts.loop ?? false)) {
      timeline!.repeat(-1);
      timeline!.repeatDelay(opts.loopDelay ?? 1);
    }
  }, root);

  return {
    play() {
      timeline?.play();
    },
    pause() {
      timeline?.pause();
    },
    replay() {
      timeline?.restart(true);
    },
    reset() {
      if (!timeline) return;
      timeline.progress(0);
      timeline.pause(0);
    },
    setSpeed(rate: number) {
      timeline?.timeScale(rate);
    },
    setLoop(loop: boolean, delay = 1) {
      if (!timeline || isScrollDriven) return;
      timeline.repeat(loop ? -1 : 0);
      timeline.repeatDelay(delay);
    },
    isScrollDriven() {
      return isScrollDriven;
    },
    getTime() {
      return timeline?.time() ?? 0;
    },
    getDuration() {
      return timeline?.duration() ?? 0;
    },
    isActive() {
      return timeline?.isActive() ?? false;
    },
    destroy() {
      // Idempotent — safe to call from both WorkspaceShell.setPlan
      // (pre-reconcile cleanup) and AnimationPreview's effect teardown.
      if (destroyed) return;
      destroyed = true;
      ctx.revert(); // kills tweens + ScrollTriggers created in this context
      timeline = null;
    },
  };
}
