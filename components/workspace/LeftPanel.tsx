"use client";

import { Panel, PanelHeader, PanelBody } from "@/components/ui/panel";
import { AnimationBuilder } from "@/components/animation/AnimationBuilder";
import type { AnimationPlan } from "@/types/animation";
import type { Screenshot } from "@/lib/projects/types";

export function LeftPanel({
  plan,
  onPlanChange,
  presetId,
  onPresetChange,
  screenshots,
  onScreenshotsChange,
}: {
  plan: AnimationPlan;
  onPlanChange: (plan: AnimationPlan) => void;
  presetId: string;
  onPresetChange: (id: string) => void;
  screenshots: Screenshot[];
  onScreenshotsChange: (shots: Screenshot[]) => void;
}) {
  return (
    <Panel className="border-r border-border">
      <PanelHeader>Configuration</PanelHeader>
      <PanelBody>
        <AnimationBuilder
          plan={plan}
          onPlanChange={onPlanChange}
          presetId={presetId}
          onPresetChange={onPresetChange}
          screenshots={screenshots}
          onScreenshotsChange={onScreenshotsChange}
        />
      </PanelBody>
    </Panel>
  );
}
