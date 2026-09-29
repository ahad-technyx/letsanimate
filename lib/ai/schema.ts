import { z } from "zod";
import type { AnimationPlan } from "@/types/animation";

export const AnimationTimingSchema = z.object({
  duration: z.number().nonnegative(),
  delay: z.number().nonnegative().optional(),
  stagger: z.number().nonnegative().optional(),
  ease: z.string().optional(),
  repeat: z.number().int().optional(),
  yoyo: z.boolean().optional(),
});

export const AnimationPropertiesSchema = z.object({
  x: z.union([z.number(), z.string()]).optional(),
  y: z.union([z.number(), z.string()]).optional(),
  scale: z.number().optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(1).optional(),
  skewX: z.number().optional(),
  skewY: z.number().optional(),
  filter: z.string().optional(),
  transformOrigin: z.string().optional(),
});

export const Animation3DPropertiesSchema = z.object({
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  positionZ: z.number().optional(),
  rotationX: z.number().optional(),
  rotationY: z.number().optional(),
  rotationZ: z.number().optional(),
  scaleX: z.number().optional(),
  scaleY: z.number().optional(),
  scaleZ: z.number().optional(),
  color: z.string().optional(),
  emissive: z.string().optional(),
  wireframe: z.boolean().optional(),
});

/** Union of 2D and 3D fields. `scale` and `opacity` are shared. */
export const AnimationElementPropertiesSchema = z.object({
  ...AnimationPropertiesSchema.shape,
  ...Animation3DPropertiesSchema.shape,
});

export const AnimationElementSchema = z.object({
  id: z.string().min(1),
  selector: z.string().min(1),
  label: z.string().optional(),
  from: AnimationElementPropertiesSchema.optional(),
  to: AnimationElementPropertiesSchema.optional(),
  timing: AnimationTimingSchema,
});

export const ScrollTriggerConfigSchema = z.object({
  trigger: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  scrub: z.union([z.boolean(), z.number()]).optional(),
  pin: z.boolean().optional(),
  markers: z.boolean().optional(),
  toggleActions: z.string().optional(),
});

export const AnimationTriggerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("onLoad") }),
  z.object({ type: z.literal("onScroll"), scrollTrigger: ScrollTriggerConfigSchema.optional() }),
  z.object({ type: z.literal("onHover"), selector: z.string() }),
  z.object({ type: z.literal("onClick"), selector: z.string() }),
  z.object({ type: z.literal("onInView"), selector: z.string(), threshold: z.number().optional() }),
]);

export const AnimationStyleSchema = z.enum([
  "minimal",
  "premium",
  "cinematic",
  "playful",
  "corporate",
  "experimental",
  "smooth",
  "fast",
]);

export const AnimationFrameworkSchema = z.enum([
  "gsap",
  "gsap-scrolltrigger",
  "css",
  "framer-motion",
  "web-animations",
  "three-js",
  "react-three-fiber",
]);

export const AnimationModeSchema = z.enum(["2d", "3d"]);

export const Animation3DSceneSchema = z.object({
  kind: z.enum(["cube", "particles", "text", "mesh", "gallery3d"]).optional(),
  camera: z
    .object({
      positionX: z.number().optional(),
      positionY: z.number().optional(),
      positionZ: z.number().optional(),
      fov: z.number().positive().max(180).optional(),
    })
    .optional(),
  background: z.string().optional(),
  ambientIntensity: z.number().min(0).max(4).optional(),
  directionalIntensity: z.number().min(0).max(4).optional(),
});

export const TimelineSegmentSchema = z.object({
  elementId: z.string(),
  label: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});

export const AnimationResponsiveConfigSchema = z.object({
  disableBelow: z.number().positive().optional(),
  reducedMotion: z.enum(["respect", "ignore"]).optional(),
  breakpoints: z.record(z.string(), z.record(z.string(), z.unknown())).optional(),
});

export const AnimationAccessibilityConfigSchema = z.object({
  respectReducedMotion: z.boolean(),
  focusManagement: z.enum(["preserve", "restore", "none"]).optional(),
  ariaLive: z.enum(["off", "polite", "assertive"]).optional(),
});

export const AnimationPerformanceConfigSchema = z.object({
  gpuAccelerated: z.boolean(),
  willChange: z.array(z.string()).optional(),
  notes: z.array(z.string()).optional(),
});

export const AnimationSubjectSchema = z.object({
  kind: z.enum(["icon", "emoji", "text"]),
  value: z.string().min(1).max(64),
  label: z.string().max(64).optional(),
});

export const AnimationPlanSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  mode: AnimationModeSchema.optional(),
  style: AnimationStyleSchema,
  trigger: AnimationTriggerSchema,
  framework: AnimationFrameworkSchema,
  elements: z.array(AnimationElementSchema).min(1),
  duration: z.number().positive(),
  ease: z.string(),
  timeline: z.array(TimelineSegmentSchema),
  responsive: AnimationResponsiveConfigSchema,
  accessibility: AnimationAccessibilityConfigSchema,
  performance: AnimationPerformanceConfigSchema,
  scene3d: Animation3DSceneSchema.optional(),
  subject: AnimationSubjectSchema.optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type AnimationPlanInput = z.input<typeof AnimationPlanSchema>;

export type ValidationResult =
  | { ok: true; plan: AnimationPlan }
  | { ok: false; error: string };

export function safeValidatePlan(input: unknown): ValidationResult {
  const parsed = AnimationPlanSchema.safeParse(input);
  if (parsed.success) return { ok: true, plan: parsed.data as AnimationPlan };
  const first = parsed.error.issues[0];
  const path = first?.path.join(".") || "plan";
  const message = first?.message ?? "Invalid plan";
  return { ok: false, error: `${path}: ${message}` };
}
