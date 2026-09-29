import type { AnimationPlan } from "@/types/animation";
import {
  dedupe,
  numOr0,
  statusFrom,
  type AdvisorIssue,
  type AdvisorResult,
} from "./advisor";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export const BREAKPOINT_WIDTH: Record<Breakpoint, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

export interface ResponsiveReport {
  desktop: AdvisorResult;
  tablet: AdvisorResult;
  mobile: AdvisorResult;
}

function planUsesPin(plan: AnimationPlan): boolean {
  return plan.trigger.type === "onScroll" && !!plan.trigger.scrollTrigger?.pin;
}

function planUsesHorizontal(plan: AnimationPlan): boolean {
  return plan.elements.some((e) => /hscroll/.test(e.selector));
}

function maxTravelPx(plan: AnimationPlan): number {
  let max = 0;
  for (const el of plan.elements) {
    const dx = Math.abs(numOr0(el.from?.x) - numOr0(el.to?.x));
    const dy = Math.abs(numOr0(el.from?.y) - numOr0(el.to?.y));
    max = Math.max(max, dx, dy);
  }
  return max;
}

function evalAt(plan: AnimationPlan, bp: Breakpoint, width: number): AdvisorResult {
  const disableBelow = plan.responsive.disableBelow ?? 0;
  if (disableBelow > width) {
    return {
      status: "good",
      issues: [],
      recommendations: [
        `Disabled at this breakpoint via responsive.disableBelow = ${disableBelow}px.`,
      ],
    };
  }

  const issues: AdvisorIssue[] = [];
  const recs: string[] = [];
  const pin = planUsesPin(plan);
  const horizontal = planUsesHorizontal(plan);
  const move = maxTravelPx(plan);
  const count = plan.elements.length;

  if (bp === "mobile") {
    if (pin || horizontal) {
      issues.push({
        id: "resp.mobile.pin-or-hscroll",
        severity: "warning",
        title: "Pin / horizontal scroll on mobile",
        message: "Pinning and horizontal-scroll patterns disorient touch users.",
      });
      recs.push("Set responsive.disableBelow ≥ 640 or replace with a fade + translate on mobile.");
    }
    if (move > 100) {
      recs.push(`Halve motion distance on mobile (max travel ${Math.round(move)}px).`);
    }
    if (count > 6) {
      recs.push(`Reduce animated elements on mobile (${count} today).`);
    }
    if (recs.length === 0) recs.push("Plan is mobile-friendly as configured.");
  } else if (bp === "tablet") {
    if (pin) recs.push("Consider disabling pin below 900px to preserve reading context.");
    if (horizontal) recs.push("Horizontal-scroll works on tablet but audit thumb reach.");
    if (move > 200) recs.push(`Reduce motion distance on tablet (max travel ${Math.round(move)}px).`);
    if (count > 8) recs.push(`Trim animated element count for tablet (${count} today).`);
    if (recs.length === 0) recs.push("Plan is tablet-friendly.");
  } else {
    // desktop
    if (pin) recs.push("Pin scroll enabled — provides scroll-jacking behavior.");
    if (horizontal) recs.push("Horizontal scroll enabled — good for gallery-style storytelling.");
    if (count > 4) recs.push(`Full plan playback (${count} elements).`);
    if (recs.length === 0) recs.push("Plan is desktop-ready.");
  }

  return { status: statusFrom(issues), issues, recommendations: dedupe(recs) };
}

export function analyzeResponsive(plan: AnimationPlan): ResponsiveReport {
  return {
    desktop: evalAt(plan, "desktop", BREAKPOINT_WIDTH.desktop),
    tablet: evalAt(plan, "tablet", BREAKPOINT_WIDTH.tablet),
    mobile: evalAt(plan, "mobile", BREAKPOINT_WIDTH.mobile),
  };
}
