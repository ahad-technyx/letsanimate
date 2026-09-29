"use client";

import {
  Play,
  Pause,
  Repeat,
  RotateCcw,
  SkipBack,
  Monitor,
  Tablet,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type Viewport = "desktop" | "tablet" | "mobile";
export type Speed = 0.5 | 1 | 2;

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
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent",
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

function SpeedBtn({
  value,
  current,
  onSelect,
}: {
  value: Speed;
  current: Speed;
  onSelect: (v: Speed) => void;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 min-w-9 items-center justify-center rounded-md border border-transparent px-2",
        "text-xs font-mono text-muted-foreground transition-colors hover:text-foreground hover:bg-muted",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "border-border bg-muted text-foreground",
      )}
    >
      {value}×
    </button>
  );
}

export interface AnimationControlsProps {
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onReset: () => void;
  viewport: Viewport;
  onViewportChange: (v: Viewport) => void;
  speed: Speed;
  onSpeedChange: (v: Speed) => void;
  loop: boolean;
  onLoopChange: (v: boolean) => void;
  loopDisabled?: boolean;
  transportDisabled?: boolean;
}

export function AnimationControls({
  playing,
  onPlay,
  onPause,
  onReplay,
  onReset,
  viewport,
  onViewportChange,
  speed,
  onSpeedChange,
  loop,
  onLoopChange,
  loopDisabled,
  transportDisabled,
}: AnimationControlsProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-3 py-1.5">
      <div className="flex items-center gap-1">
        {playing ? (
          <IconBtn onClick={onPause} label="Pause" disabled={transportDisabled}>
            <Pause className="h-4 w-4" />
          </IconBtn>
        ) : (
          <IconBtn onClick={onPlay} label="Play" disabled={transportDisabled}>
            <Play className="h-4 w-4" />
          </IconBtn>
        )}
        <IconBtn onClick={onReplay} label="Replay" disabled={transportDisabled}>
          <SkipBack className="h-4 w-4" />
        </IconBtn>
        <IconBtn onClick={onReset} label="Reset" disabled={transportDisabled}>
          <RotateCcw className="h-4 w-4" />
        </IconBtn>
        <IconBtn
          onClick={() => onLoopChange(!loop)}
          label={loop ? "Loop on" : "Loop off"}
          active={loop}
          disabled={loopDisabled}
        >
          <Repeat className="h-4 w-4" />
        </IconBtn>
        <span className="mx-1 h-5 w-px bg-border" />
        <SpeedBtn value={0.5} current={speed} onSelect={onSpeedChange} />
        <SpeedBtn value={1} current={speed} onSelect={onSpeedChange} />
        <SpeedBtn value={2} current={speed} onSelect={onSpeedChange} />
      </div>
      <div className="flex items-center gap-1">
        <IconBtn
          onClick={() => onViewportChange("desktop")}
          label="Desktop"
          active={viewport === "desktop"}
        >
          <Monitor className="h-4 w-4" />
        </IconBtn>
        <IconBtn
          onClick={() => onViewportChange("tablet")}
          label="Tablet"
          active={viewport === "tablet"}
        >
          <Tablet className="h-4 w-4" />
        </IconBtn>
        <IconBtn
          onClick={() => onViewportChange("mobile")}
          label="Mobile"
          active={viewport === "mobile"}
        >
          <Smartphone className="h-4 w-4" />
        </IconBtn>
      </div>
    </div>
  );
}
