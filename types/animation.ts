export type AnimationMode = "2d" | "3d";

export type AnimationFramework =
  | "gsap"
  | "gsap-scrolltrigger"
  | "css"
  | "framer-motion"
  | "web-animations"
  | "three-js"
  | "react-three-fiber";

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

/**
 * Per-element 3D properties. Only meaningful when `plan.mode === "3d"`.
 * Rotations are in **degrees** (converted to radians by the 3D engine) to
 * match the 2D `rotation` convention. `positionX/Y/Z` are world-space units.
 * `scale` is uniform; `scaleX/Y/Z` override per-axis. Material fields
 * (`color`, `emissive`, `opacity`, `wireframe`) animate the mesh material.
 */
export interface Animation3DProperties {
  positionX?: number;
  positionY?: number;
  positionZ?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  opacity?: number;
  color?: string;
  emissive?: string;
  wireframe?: boolean;
}

/**
 * Union of 2D + 3D property bags. All fields optional so a single element
 * only sets the ones it cares about. `plan.mode` decides which subset the
 * preview engine / code generator reads.
 */
export type AnimationElementProperties = AnimationProperties & Animation3DProperties;

export interface AnimationElement {
  id: string;
  selector: string;
  label?: string;
  from?: AnimationElementProperties;
  to?: AnimationElementProperties;
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

/**
 * Optional 3D scene configuration. Only read when `plan.mode === "3d"`.
 * The preview engine uses these to set up the camera, lights, and clear
 * color before running the per-element timeline.
 */
export interface Animation3DScene {
  /** Preset scene shape. Determines default meshes if the plan has no elements. */
  kind?: "cube" | "particles" | "text" | "mesh" | "gallery3d";
  camera?: {
    positionX?: number;
    positionY?: number;
    positionZ?: number;
    fov?: number;
  };
  background?: string;
  ambientIntensity?: number;
  directionalIntensity?: number;
}

export interface AnimationPlan {
  id: string;
  title: string;
  description: string;
  /**
   * Which animation dimension this plan targets. `"2d"` (default) uses the
   * GSAP/CSS engine; `"3d"` uses the Three.js engine. Optional on the type
   * for backward compat with stored plans — `normalizePlan` fills it in.
   */
  mode?: AnimationMode;
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
  scene3d?: Animation3DScene;
  /**
   * Optional preview hint — what's being animated (a car, a rocket, an emoji, etc.).
   * Rendered by SubjectPreview when the plan targets `.target`.
   */
  subject?: AnimationSubject;
  createdAt?: string;
  updatedAt?: string;
}
