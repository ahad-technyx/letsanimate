"use client";

import { useCallback, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { WorkspaceHeader } from "@/components/workspace/WorkspaceHeader";
import { LeftPanel } from "@/components/workspace/LeftPanel";
import { CenterPanel } from "@/components/workspace/CenterPanel";
import { RightPanel } from "@/components/workspace/RightPanel";
import { AnimationTimeline } from "@/components/animation/AnimationTimeline";
import { getPresetById } from "@/lib/animation/presets";
import { normalizePlan, validatePlan } from "@/lib/animation/utils";
import type { PreviewHandle } from "@/lib/animation/preview-engine";
import type { AnimationPlan } from "@/types/animation";
import type { Project, Screenshot } from "@/lib/projects/types";

type SaveState = "saved" | "saving" | "idle";

export function WorkspaceShell({
  project,
  onProjectChange,
  saveState,
}: {
  project: Project;
  onProjectChange: (next: Project) => void;
  saveState: SaveState;
}) {
  const plan = project.animationPlan;
  const [presetId, setPresetId] = useState<string>("__loaded__");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<PreviewHandle | null>(null);

  const setPlan = useCallback(
    (next: AnimationPlan) => {
      try {
        const normalized = normalizePlan(next);
        const result = validatePlan(normalized);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setError(null);
        // Kill the live GSAP timeline (esp. any ScrollTrigger pin, which
        // wraps DOM in a pin-spacer) BEFORE React reconciles the new plan.
        // Otherwise, a scene swap can throw "removeChild: node is not a
        // child of this node" because React doesn't know about pin-spacer.
        engineRef.current?.destroy();
        engineRef.current = null;
        onProjectChange({
          ...project,
          animationPlan: result.plan,
          framework: result.plan.framework,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to update plan");
      }
    },
    [project, onProjectChange],
  );

  const applyPreset = useCallback(
    (id: string) => {
      setPresetId(id);
      setSelectedElementId(null);
      const preset = getPresetById(id);
      if (preset) setPlan(preset.build());
    },
    [setPlan],
  );

  const onEngineReady = useCallback((handle: PreviewHandle | null) => {
    engineRef.current = handle;
  }, []);

  const setScreenshots = useCallback(
    (shots: Screenshot[]) => {
      onProjectChange({ ...project, screenshots: shots });
    },
    [project, onProjectChange],
  );

  return (
    <div className="flex h-screen flex-col">
      <WorkspaceHeader
        project={project}
        onProjectChange={onProjectChange}
        saveState={saveState}
      />

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-b border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs text-foreground"
        >
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <span className="font-mono">{error}</span>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col lg:grid lg:grid-cols-[300px_1fr_360px]">
        <div className="min-h-0 border-b border-border lg:border-b-0">
          <LeftPanel
            plan={plan}
            onPlanChange={setPlan}
            presetId={presetId}
            onPresetChange={applyPreset}
            screenshots={project.screenshots ?? []}
            onScreenshotsChange={setScreenshots}
          />
        </div>
        <div className="min-h-[420px] flex-1 lg:min-h-0">
          <CenterPanel
            plan={plan}
            onEngineReady={onEngineReady}
            selectedElementId={selectedElementId}
          />
        </div>
        <div className="min-h-0 border-t border-border lg:border-t-0">
          <RightPanel plan={plan} />
        </div>
      </div>

      <div className="min-h-40 shrink-0 border-t border-border bg-background">
        <AnimationTimeline
          plan={plan}
          onPlanChange={setPlan}
          selectedElementId={selectedElementId}
          onSelectElement={setSelectedElementId}
          engineRef={engineRef}
        />
      </div>
    </div>
  );
}
