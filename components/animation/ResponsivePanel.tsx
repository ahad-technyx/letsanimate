"use client";

import { useMemo } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";
import {
  analyzeResponsive,
  type Breakpoint,
} from "@/lib/animation/responsive";
import type { AdvisorResult } from "@/lib/animation/advisor";
import { RecommendationList, STATUS_BG, STATUS_LABEL, STATUS_TONE } from "./AdvisorShared";
import { cn } from "@/lib/utils";

const ORDER: Breakpoint[] = ["desktop", "tablet", "mobile"];

const ICON: Record<Breakpoint, React.ComponentType<{ className?: string }>> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
};

const LABEL: Record<Breakpoint, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

function BreakpointCard({
  breakpoint,
  result,
}: {
  breakpoint: Breakpoint;
  result: AdvisorResult;
}) {
  const Icon = ICON[breakpoint];
  return (
    <section
      className={cn("space-y-2 rounded-md border p-3", STATUS_BG[result.status])}
    >
      <header className="flex items-center gap-2">
        <Icon className={cn("h-4 w-4", STATUS_TONE[result.status])} />
        <span className="text-sm font-semibold">{LABEL[breakpoint]}</span>
        <span className={cn("ml-auto text-[11px] font-mono", STATUS_TONE[result.status])}>
          {STATUS_LABEL[result.status]}
        </span>
      </header>
      {result.issues.length > 0 && (
        <ul className="space-y-1">
          {result.issues.map((issue) => (
            <li
              key={issue.id}
              className="rounded-sm border border-border/60 bg-background/60 p-2 text-xs"
            >
              <p className="font-medium">{issue.title}</p>
              <p className="text-muted-foreground">{issue.message}</p>
            </li>
          ))}
        </ul>
      )}
      <RecommendationList items={result.recommendations} />
    </section>
  );
}

export function ResponsivePanel({ plan }: { plan: AnimationPlan }) {
  const report = useMemo(() => analyzeResponsive(plan), [plan]);
  return (
    <div className="space-y-3 p-4">
      {ORDER.map((bp) => (
        <BreakpointCard key={bp} breakpoint={bp} result={report[bp]} />
      ))}
    </div>
  );
}
