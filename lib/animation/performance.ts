import type { Animation3DProperties, AnimationPlan } from "@/types/animation";
import {
  dedupe,
  numOr0,
  statusFrom,
  type AdvisorIssue,
  type AdvisorResult,
} from "./advisor";

function analyze3DPerformance(plan: AnimationPlan): AdvisorResult {
  const issues: AdvisorIssue[] = [];
  const recs: string[] = [];

  const kind = plan.scene3d?.kind ?? "cube";

  // 1. Particle field is the most GPU-hungry scene.
  if (kind === "particles") {
    issues.push({
      id: "perf3d.particles",
      severity: "warning",
      title: "Particle scene is GPU-intensive",
      message: "Particle rendering keeps the GPU busy even when idle.",
    });
    recs.push("Consider disabling on mobile via responsive.disableBelow ≥ 768.");
  }

  // 2. Long total duration
  if (plan.duration > 6) {
    issues.push({
      id: "perf3d.long-duration",
      severity: "warning",
      title: "Long master timeline",
      message: `Total duration is ${plan.duration.toFixed(2)}s — WebGL keeps rendering the whole time.`,
    });
    recs.push("Tighten delays or use finite repeat counts instead of -1 (infinite).");
  }

  // 3. Elements with infinite repeat keep the GPU animating forever.
  const infinite = plan.elements.filter((e) => e.timing.repeat === -1);
  if (infinite.length > 0) {
    issues.push({
      id: "perf3d.infinite-repeat",
      severity: "warning",
      title: "Infinite repeat on 3D element(s)",
      message: `${infinite.length} element(s) loop forever, keeping the render loop hot.`,
    });
    recs.push("Bound the loop with a finite repeat count if the motion isn't essential.");
  }

  // 4. Wireframe toggles mid-timeline can force material recompiles.
  const wireframeToggle = plan.elements.some((e) => {
    const from = e.from as Animation3DProperties | undefined;
    const to = e.to as Animation3DProperties | undefined;
    return (
      from?.wireframe !== undefined &&
      to?.wireframe !== undefined &&
      from.wireframe !== to.wireframe
    );
  });
  if (wireframeToggle) {
    issues.push({
      id: "perf3d.wireframe",
      severity: "warning",
      title: "Wireframe animated between states",
      message: "Wireframe changes can force material recompile — check for hitches.",
    });
    recs.push("Split into two meshes with fixed wireframe values if the hitch shows up.");
  }

  // 5. Extremely long camera-facing translations (positionZ > 10)
  for (const el of plan.elements) {
    const from = el.from as Animation3DProperties | undefined;
    const to = el.to as Animation3DProperties | undefined;
    const dz = Math.abs(numOr0(from?.positionZ) - numOr0(to?.positionZ));
    if (dz > 10) {
      issues.push({
        id: `perf3d.deep-move.${el.id}`,
        severity: "warning",
        title: "Very long camera-axis travel",
        message: `${el.label ?? el.selector} moves ${dz.toFixed(1)} units on Z.`,
        selector: el.selector,
      });
      recs.push(`Reduce z travel on ${el.selector} or move the camera instead.`);
    }
  }

  // 6. GPU accelerated off — should always be on for 3D.
  if (plan.performance.gpuAccelerated === false) {
    issues.push({
      id: "perf3d.no-gpu",
      severity: "critical",
      title: "GPU acceleration disabled on a WebGL plan",
      message: "3D animations require GPU acceleration.",
    });
    recs.push("Set performance.gpuAccelerated = true.");
  }

  return { status: statusFrom(issues), issues, recommendations: dedupe(recs) };
}

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
  if (plan.mode === "3d") return analyze3DPerformance(plan);

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
