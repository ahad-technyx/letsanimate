"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AlertCircle, ImagePlus, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Divider } from "@/components/ui/divider";
import type {
  Animation3DScene,
  AnimationFramework,
  AnimationMode,
  AnimationPlan,
  AnimationStyle,
  AnimationTrigger,
  TriggerKind,
} from "@/types/animation";
import {
  EXAMPLE_PROMPTS,
  FRAMEWORK_OPTIONS,
  FRAMEWORK_OPTIONS_3D,
  STYLE_OPTIONS,
  TRIGGER_OPTIONS,
} from "@/lib/animation/options";
import { PresetPicker } from "@/components/animation/PresetPicker";
import { generateAnimationPlan, GenerationError } from "@/lib/ai/client";
import {
  MAX_SCREENSHOTS,
  MAX_SIZE_BYTES,
  fileToScreenshot,
  formatBytes,
  totalScreenshotBytes,
} from "@/lib/projects/screenshots";
import type { Screenshot } from "@/lib/projects/types";

const STATUS_STEPS = [
  "Analyzing animation idea…",
  "Planning motion…",
  "Building timeline…",
  "Generating code…",
];

const PROMPT_MIN = 3;
const PROMPT_MAX = 2000;

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={htmlFor}
          className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
        >
          {label}
        </label>
        {hint && <span className="text-[10px] text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function switchMode(plan: AnimationPlan, next: AnimationMode): AnimationPlan {
  if ((plan.mode ?? "2d") === next) return plan;
  if (next === "3d") {
    const scene3d: Animation3DScene = plan.scene3d ?? { kind: "cube" };
    return {
      ...plan,
      mode: "3d",
      framework: "react-three-fiber",
      trigger: { type: "onLoad" },
      scene3d,
      // A minimal default element so the 3D engine has something to animate.
      // Users replace it via presets in Phase 3 or by editing directly.
      elements:
        plan.elements.length > 0 && plan.elements.some((el) => el.id.startsWith("3d-"))
          ? plan.elements
          : [
              {
                id: "3d-primary",
                selector: scene3d.kind ?? "cube",
                label: "Primary mesh",
                from: { opacity: 0, scale: 0.2, rotationY: -180 },
                to: { opacity: 1, scale: 1, rotationY: 0 },
                timing: { duration: 1.2, delay: 0, ease: "power3.out" },
              },
            ],
    };
  }
  return {
    ...plan,
    mode: "2d",
    framework: "gsap",
    trigger: { type: "onLoad" },
  };
}

const SCENE3D_OPTIONS: { value: NonNullable<Animation3DScene["kind"]>; label: string }[] = [
  { value: "cube", label: "Rotating Cube" },
  { value: "mesh", label: "Faceted Mesh" },
  { value: "particles", label: "Particle Field" },
  { value: "text", label: "3D Text Slab" },
  { value: "gallery3d", label: "3D Gallery" },
];

function triggerFromKind(kind: TriggerKind, existing: AnimationTrigger): AnimationTrigger {
  if (kind === existing.type) return existing;
  switch (kind) {
    case "onLoad":
      return { type: "onLoad" };
    case "onScroll":
      return { type: "onScroll" };
    case "onHover":
      return { type: "onHover", selector: ".target" };
    case "onClick":
      return { type: "onClick", selector: ".target" };
    case "onInView":
      return { type: "onInView", selector: ".target", threshold: 0.2 };
  }
}

export interface AnimationBuilderProps {
  plan: AnimationPlan;
  onPlanChange: (plan: AnimationPlan) => void;
  presetId: string;
  onPresetChange: (id: string) => void;
  screenshots: Screenshot[];
  onScreenshotsChange: (shots: Screenshot[]) => void;
}

export function AnimationBuilder({
  plan,
  onPlanChange,
  presetId,
  onPresetChange,
  screenshots,
  onScreenshotsChange,
}: AnimationBuilderProps) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [statusIdx, setStatusIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (statusTimer.current) clearInterval(statusTimer.current);
    };
  }, []);

  const startStatusRotation = () => {
    setStatusIdx(0);
    statusTimer.current = setInterval(() => {
      setStatusIdx((i) => Math.min(i + 1, STATUS_STEPS.length - 1));
    }, 700);
  };
  const stopStatusRotation = () => {
    if (statusTimer.current) {
      clearInterval(statusTimer.current);
      statusTimer.current = null;
    }
  };

  const canSubmit = !generating && prompt.trim().length >= PROMPT_MIN;

  const onGenerate = async () => {
    setError(null);
    const trimmed = prompt.trim();
    if (trimmed.length < PROMPT_MIN) {
      setError("Please describe the animation you want.");
      textareaRef.current?.focus();
      return;
    }
    setGenerating(true);
    startStatusRotation();
    try {
      const next = await generateAnimationPlan({
        prompt: trimmed,
        mode: plan.mode ?? "2d",
        style: plan.style,
        trigger: plan.trigger.type,
        framework: plan.framework,
        screenshots: screenshots.length
          ? screenshots.map((s) => ({ name: s.name, dataUrl: s.dataUrl }))
          : undefined,
      });
      onPlanChange(next);
      onPresetChange("__generated__");
    } catch (e) {
      const message =
        e instanceof GenerationError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong. Try again.";
      setError(message);
    } finally {
      stopStatusRotation();
      setGenerating(false);
    }
  };

  const onPromptKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter submits; Shift + Enter inserts a newline (chat-style convention).
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void onGenerate();
    }
  };

  const clearPrompt = () => {
    setPrompt("");
    textareaRef.current?.focus();
  };

  const remaining = PROMPT_MAX - prompt.length;
  const promptTooLong = remaining < 0;

  const openFilePicker = () => fileInputRef.current?.click();

  const onFilesPicked = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file
    if (files.length === 0) return;
    const room = MAX_SCREENSHOTS - screenshots.length;
    if (room <= 0) {
      setError(`Up to ${MAX_SCREENSHOTS} screenshots.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const added: Screenshot[] = [];
      for (const file of files.slice(0, room)) {
        try {
          const shot = await fileToScreenshot(file);
          added.push(shot);
        } catch (err) {
          setError(err instanceof Error ? err.message : `Couldn't process ${file.name}.`);
        }
      }
      if (added.length === 0) return;
      const combined = [...screenshots, ...added];
      const total = totalScreenshotBytes(combined);
      if (total > MAX_SIZE_BYTES) {
        setError(
          `Total screenshot size ${formatBytes(total)} exceeds ${formatBytes(MAX_SIZE_BYTES)}. Remove or use smaller images.`,
        );
        return;
      }
      onScreenshotsChange(combined);
    } finally {
      setUploading(false);
    }
  };

  const removeScreenshot = (id: string) => {
    onScreenshotsChange(screenshots.filter((s) => s.id !== id));
  };

  const mode: AnimationMode = plan.mode ?? "2d";
  const is3D = mode === "3d";

  return (
    <form
      className="flex h-full flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void onGenerate();
      }}
      aria-label="Animation configuration"
    >
      {/* Dimension toggle — pick the animation stack before anything else. */}
      <Field label="Dimension" htmlFor="mode">
        <div
          id="mode"
          role="radiogroup"
          aria-label="Animation dimension"
          className="inline-flex w-full rounded-md border border-border bg-muted/40 p-0.5"
        >
          {(["2d", "3d"] as AnimationMode[]).map((m) => {
            const active = mode === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={generating}
                onClick={() => onPlanChange(switchMode(plan, m))}
                className={
                  "flex-1 rounded px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 " +
                  (active
                    ? "bg-accent text-accent-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {m === "2d" ? "2D · GSAP / CSS" : "3D · Three.js"}
              </button>
            );
          })}
        </div>
      </Field>

      {/* Prompt — first thing users see, hardest to miss */}
      <Field
        label="Describe your animation"
        htmlFor="prompt"
        hint={
          <span className={promptTooLong ? "text-rose-500" : undefined}>
            {prompt.length}/{PROMPT_MAX}
          </span>
        }
      >
        <div className="relative">
          <Textarea
            id="prompt"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={onPromptKeyDown}
            placeholder="e.g. Reveal the hero heading word by word, then fade the image in from the right."
            rows={5}
            className="min-h-[110px] text-sm"
            disabled={generating}
            autoFocus
          />
          {prompt.length > 0 && !generating && (
            <button
              type="button"
              onClick={clearPrompt}
              aria-label="Clear prompt"
              className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Press{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">Enter</kbd>{" "}
          to generate ·{" "}
          <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono">
            Shift + Enter
          </kbd>{" "}
          for a new line.
        </p>
        {/* Screenshots */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Reference screenshots
            </span>
            <span className="text-[10px] text-muted-foreground">
              {screenshots.length}/{MAX_SCREENSHOTS} · {formatBytes(totalScreenshotBytes(screenshots))}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {screenshots.map((s) => (
              <div
                key={s.id}
                className="group relative h-14 w-14 overflow-hidden rounded-md border border-border bg-muted"
                title={`${s.name} · ${s.width}×${s.height}`}
              >
                <Image
                  src={s.dataUrl}
                  alt={s.name}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(s.id)}
                  aria-label={`Remove ${s.name}`}
                  className="absolute right-0.5 top-0.5 hidden rounded bg-background/90 p-0.5 text-muted-foreground shadow group-hover:block hover:text-rose-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {screenshots.length < MAX_SCREENSHOTS && (
              <button
                type="button"
                onClick={openFilePicker}
                disabled={generating || uploading}
                aria-label="Attach reference screenshot"
                className="flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:border-accent/50 hover:text-foreground disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    <span className="text-[9px]">Attach</span>
                  </>
                )}
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            multiple
            className="hidden"
            onChange={onFilesPicked}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex}
              type="button"
              disabled={generating}
              onClick={() => {
                setPrompt(ex);
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:border-accent/50 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3 text-accent" />
              {ex}
            </button>
          ))}
        </div>
      </Field>

      <Divider />

      {is3D && (
        <Field label="3D Scene" htmlFor="scene3d-kind">
          <Select
            id="scene3d-kind"
            value={plan.scene3d?.kind ?? "cube"}
            disabled={generating}
            onChange={(e) => {
              const kind = e.target.value as NonNullable<Animation3DScene["kind"]>;
              onPlanChange({
                ...plan,
                scene3d: { ...(plan.scene3d ?? {}), kind },
                // Point the default element's selector at the new mesh name.
                elements: plan.elements.map((el) =>
                  el.id === "3d-primary" ? { ...el, selector: kind } : el,
                ),
              });
            }}
          >
            {SCENE3D_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {/* Preset picker — its own tab bar acts as the section heading, so
          no outer Field label needed. */}
      <PresetPicker
        presetId={presetId}
        onPresetChange={onPresetChange}
        disabled={generating}
        mode={mode}
      />

      {/* Style + Trigger + Framework — dense 2-col grid so a narrow left
          column doesn't stack three full-width selects. Trigger is hidden
          in 3D mode, and Framework spans the row when it's alone. */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Style" htmlFor="style">
          <Select
            id="style"
            value={plan.style}
            disabled={generating}
            onChange={(e) => onPlanChange({ ...plan, style: e.target.value as AnimationStyle })}
          >
            {STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>

        {!is3D && (
          <Field label="Trigger" htmlFor="trigger">
            <Select
              id="trigger"
              value={plan.trigger.type}
              disabled={generating}
              onChange={(e) =>
                onPlanChange({
                  ...plan,
                  trigger: triggerFromKind(e.target.value as TriggerKind, plan.trigger),
                })
              }
            >
              {TRIGGER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <div className={is3D ? "" : "col-span-2"}>
          <Field label="Framework" htmlFor="framework">
            <Select
              id="framework"
              value={plan.framework}
              disabled={generating}
              onChange={(e) =>
                onPlanChange({ ...plan, framework: e.target.value as AnimationFramework })
              }
            >
              {(is3D ? FRAMEWORK_OPTIONS_3D : FRAMEWORK_OPTIONS).map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div className="mt-auto space-y-2">
        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs"
          >
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-500" />
            <span className="min-w-0 flex-1">{error}</span>
          </div>
        )}
        {generating && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-xs text-foreground"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="flex-1">{STATUS_STEPS[statusIdx]}</span>
            <button
              type="button"
              onClick={() => {
                stopStatusRotation();
                setGenerating(false);
              }}
              className="rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              aria-label="Cancel generation"
            >
              Cancel
            </button>
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Animation Plan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
