"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { AnimationControls, type Speed, type Viewport } from "./AnimationControls";
import { createPreview, type PreviewHandle } from "@/lib/animation/preview-engine";
import { PreviewScene, pickPreviewScene } from "./preview/PreviewScene";
import { cn } from "@/lib/utils";
import type { AnimationPlan } from "@/types/animation";

const viewportPx: Record<Viewport, number> = {
  desktop: 1280,
  tablet: 768,
  mobile: 375,
};

const viewportClass: Record<Viewport, string> = {
  desktop: "max-w-4xl",
  tablet: "max-w-xl",
  mobile: "max-w-xs",
};

export interface AnimationPreviewProps {
  plan: AnimationPlan;
  onEngineReady?: (handle: PreviewHandle | null) => void;
  selectedElementId?: string | null;
}

export function AnimationPreview({
  plan,
  onEngineReady,
  selectedElementId,
}: AnimationPreviewProps) {
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [speed, setSpeed] = useState<Speed>(1);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);

  const sceneRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<PreviewHandle | null>(null);

  const is3D = plan.mode === "3d";
  const sceneKind = useMemo(() => pickPreviewScene(plan), [plan]);
  const isScrollDriven =
    !is3D && (plan.trigger.type === "onScroll" || plan.trigger.type === "onInView");
  const isPinned =
    !is3D && plan.trigger.type === "onScroll" && plan.trigger.scrollTrigger?.pin === true;

  const disableBelow = plan.responsive.disableBelow ?? 0;
  const currentWidth = viewportPx[viewport];
  const disabledByViewport = disableBelow > 0 && currentWidth < disableBelow;

  // Build the engine on plan / viewport / disabled / trigger change.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (disabledByViewport) return;

    const handle = createPreview(scene, plan, {
      autoplay: !isScrollDriven,
      loop: !isScrollDriven && loop,
      respectReducedMotion: plan.accessibility.respectReducedMotion,
      scroller: scrollerRef.current,
    });
    handle.setSpeed(speed);
    engineRef.current = handle;
    onEngineReady?.(handle);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPlaying(!isScrollDriven);

    return () => {
      handle.destroy();
      if (engineRef.current === handle) engineRef.current = null;
      onEngineReady?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan, viewport, disabledByViewport, isScrollDriven]);

  useEffect(() => {
    engineRef.current?.setSpeed(speed);
  }, [speed]);

  useEffect(() => {
    engineRef.current?.setLoop(loop);
  }, [loop]);

  // Selection highlight: outline every DOM node the selected plan-element
  // targets. Skipped for 3D — the canvas is a single element and the meshes
  // aren't in the DOM tree.
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene || is3D) return;
    scene.querySelectorAll(".mp-selected").forEach((el) => el.classList.remove("mp-selected"));
    if (!selectedElementId) return;
    const el = plan.elements.find((e) => e.id === selectedElementId);
    if (!el) return;
    try {
      scene.querySelectorAll(el.selector).forEach((node) => node.classList.add("mp-selected"));
    } catch {
      /* invalid selector — ignore */
    }
  }, [selectedElementId, plan, is3D]);

  const onPlay = useCallback(() => {
    engineRef.current?.play();
    setPlaying(true);
  }, []);
  const onPause = useCallback(() => {
    engineRef.current?.pause();
    setPlaying(false);
  }, []);
  const onReplay = useCallback(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    engineRef.current?.replay();
    setPlaying(true);
  }, []);
  const onReset = useCallback(() => {
    if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    engineRef.current?.reset();
    setPlaying(false);
  }, []);

  const statusLabel = isScrollDriven
    ? "Scroll-driven"
    : playing
      ? loop
        ? "Looping"
        : "Playing"
      : "Paused";

  return (
    <div className="flex h-full flex-col">
      <AnimationControls
        playing={playing}
        onPlay={onPlay}
        onPause={onPause}
        onReplay={onReplay}
        onReset={onReset}
        viewport={viewport}
        onViewportChange={setViewport}
        speed={speed}
        onSpeedChange={setSpeed}
        loop={loop}
        onLoopChange={setLoop}
        loopDisabled={isScrollDriven}
        transportDisabled={isScrollDriven}
      />

      {isScrollDriven && (
        <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
          {plan.trigger.type === "onScroll"
            ? isPinned
              ? "Scroll inside the preview to scrub the pinned animation."
              : "Scroll inside the preview to scrub the animation."
            : "Scroll to trigger the animation in view."}
        </div>
      )}

      <div className="mp-preview-backdrop relative flex-1 overflow-hidden p-6">
        {/* Top-left status pill */}
        <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-[10px] font-mono text-muted-foreground backdrop-blur">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              playing ? "bg-emerald-500" : isScrollDriven ? "bg-sky-500" : "bg-muted-foreground",
            )}
          />
          {statusLabel}
        </div>
        {/* Top-right viewport pill */}
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-full border border-border/60 bg-card/80 px-2.5 py-1 text-[10px] font-mono text-muted-foreground backdrop-blur">
          {viewport} · {currentWidth}px
        </div>

        <div
          className={cn(
            "mx-auto h-full overflow-hidden rounded-lg border border-border bg-background shadow-xl transition-[max-width] duration-200",
            viewportClass[viewport],
          )}
        >
          {disabledByViewport ? (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <p className="text-xs">
                  Animation disabled below {disableBelow}px per the responsive config.
                </p>
              </div>
            </div>
          ) : is3D ? (
            <div
              ref={sceneRef}
              className="mp-preview-scene-3d h-full w-full"
              aria-label="3D animation preview"
            />
          ) : (
            <div ref={scrollerRef} className="mp-preview-scroller h-full overflow-y-auto">
              <div ref={sceneRef} className="mp-preview-scene">
                <PreviewScene kind={sceneKind} plan={plan} />
                {isScrollDriven && <div className="h-[70vh]" aria-hidden />}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
