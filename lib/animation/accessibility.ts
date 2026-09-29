import type { AnimationPlan } from "@/types/animation";
import {
  dedupe,
  numOr0,
  statusFrom,
  type AdvisorIssue,
  type AdvisorResult,
} from "./advisor";

export function analyzeAccessibility(plan: AnimationPlan): AdvisorResult {
  const issues: AdvisorIssue[] = [];
  const recs: string[] = [];
  const a11y = plan.accessibility;

  // 1. Reduced motion respect
  if (!a11y.respectReducedMotion) {
    issues.push({
      id: "a11y.reduced-motion",
      severity: "critical",
      title: "prefers-reduced-motion ignored",
      message: "Users with vestibular sensitivity cannot opt out of this animation.",
    });
    recs.push("Enable accessibility.respectReducedMotion so the engine snaps to end state.");
  }

  // 2. Rapid large motion (distance ÷ duration heuristic)
  for (const el of plan.elements) {
    const dx = Math.abs(numOr0(el.from?.x) - numOr0(el.to?.x));
    const dy = Math.abs(numOr0(el.from?.y) - numOr0(el.to?.y));
    const dist = Math.max(dx, dy);
    if (dist > 300 && el.timing.duration < 0.5) {
      issues.push({
        id: `a11y.rapid.${el.id}`,
        severity: "warning",
        title: "Rapid large motion",
        message: `${el.label ?? el.selector} moves ${Math.round(dist)}px in ${el.timing.duration.toFixed(2)}s.`,
        selector: el.selector,
      });
      recs.push(`Lengthen the duration or shorten travel on ${el.selector}.`);
    }
  }

  // 3. Multiple rotations
  for (const el of plan.elements) {
    const rot = Math.abs(numOr0(el.from?.rotation) - numOr0(el.to?.rotation));
    if (rot > 360) {
      issues.push({
        id: `a11y.rotation.${el.id}`,
        severity: "warning",
        title: "Multiple full rotations",
        message: `${el.label ?? el.selector} rotates ${Math.round(rot)}°.`,
        selector: el.selector,
      });
      recs.push(`Cap rotation near 360° on ${el.selector} for motion-sensitive users.`);
    }
  }

  // 4. Very fast stagger
  const fast = plan.elements.find(
    (e) => (e.timing.stagger ?? 0) > 0 && (e.timing.stagger ?? 0) < 0.05,
  );
  if (fast) {
    issues.push({
      id: "a11y.stagger-fast",
      severity: "warning",
      title: "Very fast stagger",
      message: `Stagger under 0.05s can feel disorienting (${fast.label ?? fast.selector}).`,
      selector: fast.selector,
    });
    recs.push("Increase stagger to ≥ 0.06s so each item is discernible.");
  }

  // 5. Interactive trigger without focus management
  if ((plan.trigger.type === "onClick" || plan.trigger.type === "onHover") && !a11y.focusManagement) {
    issues.push({
      id: "a11y.focus",
      severity: "warning",
      title: "No focus management",
      message: "Interactive triggers should define focus behavior for keyboard users.",
    });
    recs.push("Set accessibility.focusManagement to \"preserve\" or \"restore\".");
  }

  return { status: statusFrom(issues), issues, recommendations: dedupe(recs) };
}

/**
 * Emit a copy-pasteable reduced-motion CSS snippet that neutralizes the plan.
 * Complements the runtime engine's reduced-motion handling for CSS-only implementations.
 */
export function reducedMotionCss(plan: AnimationPlan): string {
  const selectors = Array.from(new Set(plan.elements.map((e) => e.selector))).join(", ");
  if (!selectors) return "";
  return `@media (prefers-reduced-motion: reduce) {\n  ${selectors} {\n    animation: none !important;\n    transition: none !important;\n  }\n}\n`;
}
