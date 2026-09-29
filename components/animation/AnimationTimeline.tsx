"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnimationElement, AnimationPlan } from "@/types/animation";
import type { PreviewHandle } from "@/lib/animation/preview-engine";

const TRACK_COLORS = [
  "bg-accent",
  "bg-emerald-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-rose-500",
];

const ZOOM_MIN = 40;
const ZOOM_MAX = 400;
const ZOOM_STEP = 1.5;
const MIN_DURATION = 0.05;
const RESIZE_HANDLE_PX = 8;
const LABEL_COL = "w-28";
const ROW_H = 28;
const RULER_H = 24;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function IconBtn({
  onClick,
  label,
  active,
  disabled,
  children,
}: {
  onClick: () => void;
  label: string;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-transparent",
        "text-muted-foreground transition-colors hover:text-foreground hover:bg-muted",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-40 disabled:pointer-events-none",
        active && "border-border bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

interface DragState {
  elementId: string;
  mode: "move" | "resize";
  startX: number;
  startDelay: number;
  startDuration: number;
  draftDelay: number;
  draftDuration: number;
}

interface AnimationTimelineProps {
  plan: AnimationPlan;
  onPlanChange: (plan: AnimationPlan) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  engineRef: React.RefObject<PreviewHandle | null>;
}

export function AnimationTimeline({
  plan,
  onPlanChange,
  selectedElementId,
  onSelectElement,
  engineRef,
}: AnimationTimelineProps) {
  const [zoom, setZoom] = useState(120);
  const [drag, setDrag] = useState<DragState | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);

  const totalDuration = useMemo(() => Math.max(plan.duration, 0.5), [plan.duration]);
  const totalPx = totalDuration * zoom;
  const selectedElement = useMemo(
    () => plan.elements.find((e) => e.id === selectedElementId) ?? null,
    [plan.elements, selectedElementId],
  );

  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, z * ZOOM_STEP));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, z / ZOOM_STEP));

  // Engine transport
  const onPlay = () => engineRef.current?.play();
  const onPause = () => engineRef.current?.pause();
  const onReplay = () => engineRef.current?.replay();
  const onReset = () => engineRef.current?.reset();

  // Playhead: rAF DOM writes only, no React re-renders per frame.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const engine = engineRef.current;
      const head = playheadRef.current;
      if (engine && head) {
        const t = engine.getTime();
        head.style.transform = `translateX(${t * zoom}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engineRef, zoom]);

  // Drag block: move or resize
  const onBlockPointerDown = useCallback(
    (
      e: ReactPointerEvent<HTMLDivElement>,
      el: AnimationElement,
      mode: "move" | "resize",
    ) => {
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      onSelectElement(el.id);
      setDrag({
        elementId: el.id,
        mode,
        startX: e.clientX,
        startDelay: el.timing.delay ?? 0,
        startDuration: el.timing.duration,
        draftDelay: el.timing.delay ?? 0,
        draftDuration: el.timing.duration,
      });
    },
    [onSelectElement],
  );

  const onBlockPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag) return;
      const dx = e.clientX - drag.startX;
      const dt = dx / zoom;
      if (drag.mode === "move") {
        setDrag({ ...drag, draftDelay: Math.max(0, round2(drag.startDelay + dt)) });
      } else {
        setDrag({
          ...drag,
          draftDuration: Math.max(MIN_DURATION, round2(drag.startDuration + dt)),
        });
      }
    },
    [drag, zoom],
  );

  const commitDrag = useCallback(() => {
    if (!drag) return;
    const el = plan.elements.find((e) => e.id === drag.elementId);
    if (!el) {
      setDrag(null);
      return;
    }
    const nextTiming = {
      ...el.timing,
      delay: drag.mode === "move" ? drag.draftDelay : el.timing.delay,
      duration: drag.mode === "resize" ? drag.draftDuration : el.timing.duration,
    };
    onPlanChange({
      ...plan,
      elements: plan.elements.map((e) =>
        e.id === el.id ? { ...e, timing: nextTiming } : e,
      ),
    });
    setDrag(null);
  }, [drag, plan, onPlanChange]);

  const onBlockPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
      commitDrag();
    },
    [commitDrag],
  );

  // Numeric inspector edits (delay / duration / stagger)
  const updateSelectedTiming = useCallback(
    (patch: Partial<AnimationElement["timing"]>) => {
      if (!selectedElement) return;
      onPlanChange({
        ...plan,
        elements: plan.elements.map((e) =>
          e.id === selectedElement.id ? { ...e, timing: { ...e.timing, ...patch } } : e,
        ),
      });
    },
    [selectedElement, plan, onPlanChange],
  );

  // Ruler ticks: readable at any zoom.
  const tickStep = zoom < 60 ? 1 : zoom < 120 ? 0.5 : zoom < 240 ? 0.25 : 0.1;
  const ticks: number[] = [];
  for (let t = 0; t <= totalDuration + 0.0001; t += tickStep) ticks.push(round2(t));

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-1.5">
        <IconBtn onClick={onPlay} label="Play">
          <Play className="h-4 w-4" />
        </IconBtn>
        <IconBtn onClick={onPause} label="Pause">
          <Pause className="h-4 w-4" />
        </IconBtn>
        <IconBtn onClick={onReplay} label="Replay">
          <SkipBack className="h-4 w-4" />
        </IconBtn>
        <IconBtn onClick={onReset} label="Reset">
          <RotateCcw className="h-4 w-4" />
        </IconBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <IconBtn onClick={zoomOut} label="Zoom out" disabled={zoom <= ZOOM_MIN + 0.001}>
          <ZoomOut className="h-4 w-4" />
        </IconBtn>
        <IconBtn onClick={zoomIn} label="Zoom in" disabled={zoom >= ZOOM_MAX - 0.001}>
          <ZoomIn className="h-4 w-4" />
        </IconBtn>
        <span className="ml-1 font-mono text-[10px] text-muted-foreground">
          {Math.round(zoom)} px/s · {totalDuration.toFixed(2)}s total
        </span>

        {selectedElement && (
          <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">
              {selectedElement.label ?? selectedElement.selector}
            </span>
            <NumberField
              label="Delay"
              value={selectedElement.timing.delay ?? 0}
              min={0}
              step={0.05}
              onCommit={(v) => updateSelectedTiming({ delay: v })}
            />
            <NumberField
              label="Duration"
              value={selectedElement.timing.duration}
              min={MIN_DURATION}
              step={0.05}
              onCommit={(v) => updateSelectedTiming({ duration: v })}
            />
            <NumberField
              label="Stagger"
              value={selectedElement.timing.stagger ?? 0}
              min={0}
              step={0.02}
              onCommit={(v) =>
                updateSelectedTiming({ stagger: v > 0 ? v : undefined })
              }
            />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1">
        {/* Fixed labels column */}
        <div className={cn("shrink-0 border-r border-border", LABEL_COL)}>
          <div style={{ height: RULER_H }} />
          {plan.elements.map((el) => (
            <div
              key={el.id}
              onClick={() =>
                onSelectElement(el.id === selectedElementId ? null : el.id)
              }
              className={cn(
                "flex cursor-pointer items-center truncate border-b border-border/60 px-3 text-xs",
                selectedElementId === el.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              style={{ height: ROW_H }}
            >
              {el.label ?? el.selector}
            </div>
          ))}
        </div>

        {/* Scrollable tracks + ruler */}
        <div
          ref={scrollRef}
          className="relative min-w-0 flex-1 overflow-x-auto overflow-y-hidden"
        >
          <div style={{ width: totalPx, position: "relative" }}>
            {/* Ruler */}
            <div
              className="relative border-b border-border"
              style={{ height: RULER_H }}
            >
              {ticks.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 h-full"
                  style={{ left: t * zoom }}
                >
                  <div className="h-2 w-px bg-border" />
                  <span className="ml-1 select-none font-mono text-[10px] text-muted-foreground">
                    {t.toFixed(t < 1 ? 2 : 1)}s
                  </span>
                </div>
              ))}
            </div>

            {/* Tracks */}
            {plan.elements.map((el, idx) => {
              const color = TRACK_COLORS[idx % TRACK_COLORS.length];
              const active = drag?.elementId === el.id;
              const delay = active ? drag.draftDelay : el.timing.delay ?? 0;
              const duration = active ? drag.draftDuration : el.timing.duration;
              const left = delay * zoom;
              const width = Math.max(duration * zoom, 6);
              const isSelected = selectedElementId === el.id;
              return (
                <div
                  key={el.id}
                  className={cn(
                    "relative border-b border-border/60",
                    isSelected && "bg-muted/40",
                  )}
                  style={{ height: ROW_H }}
                  onClick={() =>
                    onSelectElement(el.id === selectedElementId ? null : el.id)
                  }
                >
                  {/* Ruler faint gridlines */}
                  {ticks.map((t) => (
                    <div
                      key={t}
                      className="absolute top-0 h-full w-px bg-border/40"
                      style={{ left: t * zoom }}
                    />
                  ))}
                  {/* Block */}
                  <div
                    role="button"
                    aria-label={`${el.label ?? el.selector} timing block`}
                    aria-pressed={isSelected}
                    onPointerDown={(e) => onBlockPointerDown(e, el, "move")}
                    onPointerMove={onBlockPointerMove}
                    onPointerUp={onBlockPointerUp}
                    onPointerCancel={onBlockPointerUp}
                    title={`${el.label ?? el.selector} · ${delay.toFixed(2)}s → ${(delay + duration).toFixed(2)}s`}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 cursor-grab select-none rounded-sm shadow-sm",
                      "active:cursor-grabbing",
                      color,
                      isSelected ? "opacity-100 ring-2 ring-foreground/50" : "opacity-80",
                    )}
                    style={{ left, width, height: ROW_H - 8 }}
                  >
                    <span className="pointer-events-none block truncate px-1.5 text-[10px] leading-5 text-background/90 mix-blend-luminosity">
                      {duration.toFixed(2)}s
                    </span>
                    {/* Resize handle */}
                    <div
                      onPointerDown={(e) => onBlockPointerDown(e, el, "resize")}
                      onPointerMove={onBlockPointerMove}
                      onPointerUp={onBlockPointerUp}
                      onPointerCancel={onBlockPointerUp}
                      className="absolute right-0 top-0 h-full cursor-ew-resize"
                      style={{ width: RESIZE_HANDLE_PX }}
                    />
                  </div>
                </div>
              );
            })}

            {/* Playhead — spans ruler + tracks; updated via rAF DOM writes */}
            <div
              ref={playheadRef}
              className="pointer-events-none absolute top-0 h-full w-px bg-accent"
              style={{
                left: 0,
                height: RULER_H + plan.elements.length * ROW_H,
                transform: "translateX(0px)",
              }}
            >
              <div className="absolute -left-[3px] top-0 h-2 w-1.5 rounded-b-sm bg-accent" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  onCommit,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  onCommit: (v: number) => void;
}) {
  const [local, setLocal] = useState(value.toFixed(2));
  useEffect(() => {
    // Sync external plan changes into the input draft.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocal(value.toFixed(2));
  }, [value]);

  const commit = () => {
    const n = parseFloat(local);
    if (Number.isFinite(n)) {
      onCommit(Math.max(min, round2(n)));
    } else {
      setLocal(value.toFixed(2));
    }
  };

  return (
    <label className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        step={step}
        min={min}
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="h-6 w-16 rounded border border-input bg-background px-1.5 text-right font-mono text-[11px] text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <span className="font-mono">s</span>
    </label>
  );
}

