import type { AnimationFramework, AnimationStyle, TriggerKind } from "@/types/animation";

export interface OptionItem<T extends string> {
  value: T;
  label: string;
}

export const STYLE_OPTIONS: OptionItem<AnimationStyle>[] = [
  { value: "minimal", label: "Minimal" },
  { value: "premium", label: "Premium" },
  { value: "cinematic", label: "Cinematic" },
  { value: "playful", label: "Playful" },
  { value: "corporate", label: "Corporate" },
  { value: "experimental", label: "Experimental" },
  { value: "smooth", label: "Smooth" },
  { value: "fast", label: "Fast" },
];

export const TRIGGER_OPTIONS: OptionItem<TriggerKind>[] = [
  { value: "onLoad", label: "Page Load" },
  { value: "onScroll", label: "Scroll" },
  { value: "onHover", label: "Hover" },
  { value: "onClick", label: "Click" },
  { value: "onInView", label: "Viewport" },
];

export const FRAMEWORK_OPTIONS: OptionItem<AnimationFramework>[] = [
  { value: "gsap", label: "GSAP" },
  { value: "gsap-scrolltrigger", label: "GSAP + ScrollTrigger" },
  { value: "css", label: "CSS" },
  { value: "framer-motion", label: "Framer Motion" },
];

/** Framework options offered when `plan.mode === "3d"`. */
export const FRAMEWORK_OPTIONS_3D: OptionItem<AnimationFramework>[] = [
  { value: "react-three-fiber", label: "React Three Fiber" },
  { value: "three-js", label: "Three.js (vanilla)" },
];

export const EXAMPLE_PROMPTS = [
  "Reveal the hero heading word by word.",
  "Create a cinematic hero entrance.",
  "Make cards appear one by one on scroll.",
  "Pin the section and move cards horizontally.",
];

export const DEFAULTS = {
  style: "premium" as AnimationStyle,
  trigger: "onLoad" as TriggerKind,
  framework: "gsap" as AnimationFramework,
};
