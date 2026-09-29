"use client";

import { useMemo } from "react";
import type { AnimationPlan } from "@/types/animation";
import { analyzePerformance } from "@/lib/animation/performance";
import {
  IssueList,
  RecommendationList,
  SectionTitle,
  StatusHeader,
} from "./AdvisorShared";

export function PerformancePanel({ plan }: { plan: AnimationPlan }) {
  const result = useMemo(() => analyzePerformance(plan), [plan]);
  return (
    <div className="space-y-4 p-4">
      <StatusHeader status={result.status} title="Performance advisor" />

      {result.issues.length > 0 && (
        <div className="space-y-1.5">
          <SectionTitle>Issues</SectionTitle>
          <IssueList issues={result.issues} />
        </div>
      )}

      {result.recommendations.length > 0 && (
        <div className="space-y-1.5">
          <SectionTitle>Recommendations</SectionTitle>
          <RecommendationList items={result.recommendations} />
        </div>
      )}

      {result.status === "good" && result.recommendations.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No performance concerns detected in this plan.
        </p>
      )}
    </div>
  );
}
