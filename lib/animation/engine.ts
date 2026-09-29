import type { AnimationPlan } from "@/types/animation";

export interface EngineHandle {
  destroy: () => void;
}

export function createAnimationEngine(_root: HTMLElement, _plan: AnimationPlan): EngineHandle {
  return {
    destroy: () => {
      /* GSAP context cleanup will be implemented in a later phase. */
    },
  };
}
