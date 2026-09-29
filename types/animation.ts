export type AnimationFramework =
  | "gsap"
  | "gsap-scrolltrigger"
  | "css"
  | "framer-motion"
  | "web-animations";

export type AnimationStyle =
  | "minimal"
  | "premium"
  | "cinematic"
  | "playful"
  | "corporate"
  | "experimental"
  | "smooth"
  | "fast";

export type TriggerKind = "onLoad" | "onScroll" | "onHover" | "onClick" | "onInView";

export type AnimationTrigger =
  | { type: "onLoad" }
  | { type: "onScroll"; scrollTrigger?: ScrollTriggerConfig }
  | { type: "onHover"; selector: string }
  | { type: "onClick"; selector: string }
  | { type: "onInView"; selector: string; threshold?: number };

export type Easing = string;

export interface AnimationTiming {
  duration: number;
  delay?: number;
  stagger?: number;
  ease?: Easing;
  repeat?: number;
  yoyo?: boolean;
}

export interface AnimationProperties {
  x?: number | string;
  y?: number | string;
  scale?: number;
  rotation?: number;
  opacity?: number;
  skewX?: number;
  skewY?: number;
  filter?: string;
  transformOrigin?: string;
}

export interface AnimationElement {
  id: string;
  selector: string;
  label?: string;
  from?: AnimationProperties;
  to?: AnimationProperties;
  timing: AnimationTiming;
}

export interface ScrollTriggerConfig {
  trigger: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  markers?: boolean;
  toggleActions?: string;
}

export interface AnimationResponsiveConfig {
  disableBelow?: number;
  reducedMotion?: "respect" | "ignore";
  breakpoints?: Record<string, Partial<AnimationProperties>>;
}

export interface AnimationAccessibilityConfig {
  respectReducedMotion: boolean;
  focusManagement?: "preserve" | "restore" | "none";
  ariaLive?: "off" | "polite" | "assertive";
}

export interface AnimationPerformanceConfig {
  gpuAccelerated: boolean;
  willChange?: string[];
  notes?: string[];
}

export type SubjectKind = "icon" | "emoji" | "text";

export interface AnimationSubject {
  kind: SubjectKind;
  /** For "icon": lowercase name from lib/animation/subjects. For "emoji"/"text": literal string. */
  value: string;
  label?: string;
}

export interface TimelineSegment {
  elementId: string;
  label: string;
  start: number;
  end: number;
}

export interface AnimationPlan {
  id: string;
  title: string;
  description: string;
  style: AnimationStyle;
  trigger: AnimationTrigger;
  framework: AnimationFramework;
  elements: AnimationElement[];
  duration: number;
  ease: Easing;
  timeline: TimelineSegment[];
  responsive: AnimationResponsiveConfig;
  accessibility: AnimationAccessibilityConfig;
  performance: AnimationPerformanceConfig;
  /**
   * Optional preview hint — what's being animated (a car, a rocket, an emoji, etc.).
   * Rendered by SubjectPreview when the plan targets `.target`.
   */
  subject?: AnimationSubject;
  createdAt?: string;
  updatedAt?: string;
}
