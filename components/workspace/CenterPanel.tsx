"use client";

import { AnimationPreview } from "@/components/animation/AnimationPreview";
import { Panel, PanelHeader } from "@/components/ui/panel";
import type { PreviewHandle } from "@/lib/animation/preview-engine";
import type { AnimationPlan } from "@/types/animation";

export function CenterPanel({
  plan,
  onEngineReady,
  selectedElementId,
}: {
  plan: AnimationPlan;
  onEngineReady?: (handle: PreviewHandle | null) => void;
  selectedElementId?: string | null;
}) {
  return (
    <Panel>
      <PanelHeader>
        <span>Preview</span>
        <span className="normal-case tracking-normal text-muted-foreground">{plan.title}</span>
      </PanelHeader>
      <div className="flex-1 overflow-hidden">
        <AnimationPreview
          plan={plan}
          onEngineReady={onEngineReady}
          selectedElementId={selectedElementId}
        />
      </div>
    </Panel>
  );
}
