import type { AnimationElement, AnimationPlan, TimelineSegment } from "@/types/animation";

/**
 * Timeline is derived deterministically from each element's absolute delay (start)
 * and duration. Delay is treated as the segment's start time on the master timeline.
 */
export function buildTimelineSegments(plan: Pick<AnimationPlan, "elements">): TimelineSegment[] {
  return plan.elements.map((el: AnimationElement) => {
    const start = el.timing.delay ?? 0;
    const end = start + el.timing.duration;
    return {
      elementId: el.id,
      label: el.label ?? el.selector,
      start,
      end,
    };
  });
}

export function timelineTotalDuration(segments: TimelineSegment[]): number {
  return segments.reduce((max, s) => Math.max(max, s.end), 0);
}
