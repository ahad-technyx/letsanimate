"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";
import { analyzeAccessibility, reducedMotionCss } from "@/lib/animation/accessibility";
import { Button } from "@/components/ui/button";
import {
  IssueList,
  RecommendationList,
  SectionTitle,
  StatusHeader,
} from "./AdvisorShared";

export function AccessibilityPanel({ plan }: { plan: AnimationPlan }) {
  const result = useMemo(() => analyzeAccessibility(plan), [plan]);
  const snippet = useMemo(() => reducedMotionCss(plan), [plan]);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className="space-y-4 p-4">
      <StatusHeader status={result.status} title="Accessibility advisor" />

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

      {snippet && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <SectionTitle>Reduced-motion CSS</SectionTitle>
            <Button variant="ghost" size="sm" onClick={onCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="mp-code overflow-auto rounded-md border border-border bg-card p-3 font-mono text-[11px] leading-relaxed">
            <code>{snippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
