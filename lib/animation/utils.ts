import type {
  AnimationElement,
  AnimationPlan,
  Easing,
  TimelineSegment,
} from "@/types/animation";
import { buildTimelineSegments } from "./timeline";
import { safeValidatePlan, type ValidationResult } from "@/lib/ai/schema";

export function estimatePlanDuration(plan: Pick<AnimationPlan, "elements">): number {
  return plan.elements.reduce((total, el) => {
    const stepEnd = (el.timing.delay ?? 0) + el.timing.duration;
    return Math.max(total, stepEnd);
  }, 0);
}

/**
 * Fill in derived fields (timeline, duration) and default any missing collections.
 * Non-mutating.
 */
export function normalizePlan(plan: AnimationPlan): AnimationPlan {
  const timeline: TimelineSegment[] = buildTimelineSegments(plan);
  const duration = plan.duration > 0 ? plan.duration : estimatePlanDuration(plan);
  return {
    ...plan,
    duration,
    timeline,
    responsive: plan.responsive ?? { reducedMotion: "respect" },
    accessibility: plan.accessibility ?? { respectReducedMotion: true },
    performance: plan.performance ?? { gpuAccelerated: true, willChange: ["transform", "opacity"] },
  };
}

export function validatePlan(input: unknown): ValidationResult {
  return safeValidatePlan(input);
}

/**
 * Convert an AnimationElement to GSAP-friendly fromTo argument tuples.
 * Usage: gsap.fromTo(selector, ...toGsapVars(el))
 */
export function toGsapVars(
  el: AnimationElement,
  defaultEase: Easing = "power2.out",
): [Record<string, unknown>, Record<string, unknown>] {
  const from = { ...(el.from ?? {}) };
  const to: Record<string, unknown> = {
    ...(el.to ?? {}),
    duration: el.timing.duration,
  };
  if (el.timing.delay !== undefined) to.delay = el.timing.delay;
  if (el.timing.stagger !== undefined) to.stagger = el.timing.stagger;
  if (el.timing.repeat !== undefined) to.repeat = el.timing.repeat;
  if (el.timing.yoyo !== undefined) to.yoyo = el.timing.yoyo;
  to.ease = el.timing.ease ?? defaultEase;
  return [from, to];
}

/**
 * Emit a copy-pasteable GSAP snippet for the given plan.
 * This does not run the animation — it's a code preview only.
 */
export function planToGsapCode(plan: AnimationPlan): string {
  const lines: string[] = [];
  lines.push(`// ${plan.title}`);
  lines.push(`// ${plan.description}`);
  lines.push(`import gsap from "gsap";`);
  if (plan.framework === "gsap-scrolltrigger") {
    lines.push(`import { ScrollTrigger } from "gsap/ScrollTrigger";`);
    lines.push(`gsap.registerPlugin(ScrollTrigger);`);
  }
  lines.push(``);
  lines.push(`const tl = gsap.timeline({ defaults: { ease: ${JSON.stringify(plan.ease)} } });`);
  for (const el of plan.elements) {
    const [from, to] = toGsapVars(el, plan.ease);
    const start = el.timing.delay ?? 0;
    lines.push(
      `tl.fromTo(${JSON.stringify(el.selector)}, ${JSON.stringify(from)}, ${JSON.stringify(to)}, ${start});`,
    );
  }
  return lines.join("\n");
}
