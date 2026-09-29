import type { AnimationPlan } from "@/types/animation";
import {
  dedupe,
  numOr0,
  statusFrom,
  type AdvisorIssue,
  type AdvisorResult,
} from "./advisor";

function peakConcurrency(plan: AnimationPlan): number {
  const events: Array<{ t: number; delta: number }> = [];
  for (const s of plan.timeline) {
    events.push({ t: s.start, delta: 1 });
    events.push({ t: s.end, delta: -1 });
  }
  // Order: starts before ends at the same instant so a single-point overlap counts once.
  events.sort((a, b) => a.t - b.t || b.delta - a.delta);
  let concurrent = 0;
  let peak = 0;
  for (const e of events) {
    concurrent += e.delta;
    if (concurrent > peak) peak = concurrent;
  }
  return peak;
}

function blurRadius(filter: unknown): number {
  if (typeof filter !== "string") return 0;
  const m = filter.match(/blur\(\s*([0-9]*\.?[0-9]+)/i);
  return m ? parseFloat(m[1]) : 0;
}

export function analyzePerformance(plan: AnimationPlan): AdvisorResult {
  const issues: AdvisorIssue[] = [];
  const recs: string[] = [];

  // 1. Element count
  if (plan.elements.length > 20) {
    issues.push({
      id: "perf.many-elements",
      severity: "critical",
      title: "Very high element count",
      message: `${plan.elements.length} elements animate in one plan.`,
    });
    recs.push("Split the animation into sequential sub-plans or group nearby elements.");
  } else if (plan.elements.length > 12) {
    issues.push({
      id: "perf.many-elements",
      severity: "warning",
      title: "High element count",
      message: `${plan.elements.length} elements animate in one plan.`,
    });
    recs.push("Reduce simultaneous animations for smoother frame budgets on mid-range devices.");
  }

  // 2. Peak concurrency from the timeline
  const peak = peakConcurrency(plan);
  if (peak > 15) {
    issues.push({
      id: "perf.peak-concurrency",
      severity: "critical",
      title: "High simultaneous concurrency",
      message: `${peak} elements animate at the same time.`,
    });
    recs.push("Stagger start times or split into sequential sub-timelines.");
  } else if (peak > 8) {
    issues.push({
      id: "perf.peak-concurrency",
      severity: "warning",
      title: "Elevated concurrency",
      message: `Up to ${peak} elements animate concurrently.`,
    });
    recs.push("Consider adding small delays between elements to smooth GPU load.");
  }

  // 3. Filter / blur usage
  for (const el of plan.elements) {
    const px = Math.max(blurRadius(el.from?.filter), blurRadius(el.to?.filter));
    if (px > 20) {
      issues.push({
        id: `perf.blur.${el.id}`,
        severity: "warning",
        title: "Heavy blur filter",
        message: `${el.label ?? el.selector} uses blur ${px}px — expensive on mobile GPUs.`,
        selector: el.selector,
      });
      recs.push(`Cap blur on ${el.selector} near 10px, or animate opacity instead.`);
    } else if (px > 10) {
      issues.push({
        id: `perf.blur.${el.id}`,
        severity: "warning",
        title: "Elevated blur radius",
        message: `${el.label ?? el.selector} animates a ${px}px blur.`,
        selector: el.selector,
      });
    }
  }

  // 4. Large movements
  for (const el of plan.elements) {
    const dx = Math.abs(numOr0(el.from?.x) - numOr0(el.to?.x));
    const dy = Math.abs(numOr0(el.from?.y) - numOr0(el.to?.y));
    const dist = Math.max(dx, dy);
    if (dist > 400) {
      issues.push({
        id: `perf.large-move.${el.id}`,
        severity: "warning",
        title: "Long travel distance",
        message: `${el.label ?? el.selector} moves ${Math.round(dist)}px.`,
        selector: el.selector,
      });
      recs.push(`Consider reducing motion distance on ${el.selector} for mobile.`);
    }
  }

  // 5. Excessive will-change
  const wc = plan.performance.willChange ?? [];
  if (wc.length > 4) {
    issues.push({
      id: "perf.willchange",
      severity: "warning",
      title: "Excessive will-change hints",
      message: `${wc.length} properties hinted globally.`,
    });
    recs.push("Limit will-change to properties that actually animate — extra hints cost memory.");
  }

  // 6. GPU accelerated off
  if (plan.performance.gpuAccelerated === false) {
    issues.push({
      id: "perf.no-gpu",
      severity: "warning",
      title: "GPU acceleration disabled",
      message: "Consider transform/opacity to stay on the compositor path.",
    });
    recs.push("Prefer transform and opacity over layout-affecting properties.");
  }

  // 7. Long total duration
  if (plan.duration > 6) {
    issues.push({
      id: "perf.long-duration",
      severity: "warning",
      title: "Long master timeline",
      message: `Total duration is ${plan.duration.toFixed(2)}s.`,
    });
    recs.push("Tighten delays or shorten element durations to hold attention.");
  }

  // 8. Scroll-linked + filter combo
  const hasFilter = plan.elements.some((e) => e.from?.filter || e.to?.filter);
  if (plan.trigger.type === "onScroll" && hasFilter) {
    issues.push({
      id: "perf.scroll-filter",
      severity: "warning",
      title: "Scroll-linked filters",
      message: "Filters recomputed every scroll frame can cause jank.",
    });
    recs.push("Move filter changes off the scroll timeline or bake them into a keyframe range.");
  }

  return { status: statusFrom(issues), issues, recommendations: dedupe(recs) };
}
