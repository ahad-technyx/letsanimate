"use client";

import { useMemo, useState } from "react";
import {
  LayoutGrid,
  Layers,
  Sparkles,
  Type,
  type LucideIcon,
} from "lucide-react";
import {
  PRESETS,
  PRESET_CATEGORY_LABELS,
  PRESET_CATEGORY_ORDER,
  type PresetCategory,
} from "@/lib/animation/presets";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const CATEGORY_ICON: Record<PresetCategory, LucideIcon> = {
  heading: Type,
  boxes: LayoutGrid,
  section: Layers,
  generic: Sparkles,
};

// Per-category accent tints — kept subtle so multiple cards on screen
// don't fight for attention.
const CATEGORY_TINT: Record<PresetCategory, { icon: string; ring: string; glow: string }> = {
  heading: {
    icon: "text-sky-400",
    ring: "ring-sky-400/60",
    glow: "from-sky-500/12 via-transparent",
  },
  boxes: {
    icon: "text-fuchsia-400",
    ring: "ring-fuchsia-400/60",
    glow: "from-fuchsia-500/12 via-transparent",
  },
  section: {
    icon: "text-emerald-400",
    ring: "ring-emerald-400/60",
    glow: "from-emerald-500/12 via-transparent",
  },
  generic: {
    icon: "text-accent",
    ring: "ring-accent/60",
    glow: "from-accent/12 via-transparent",
  },
};

export interface PresetPickerProps {
  presetId: string;
  onPresetChange: (id: string) => void;
  disabled?: boolean;
}

// Cache built descriptions once — build() is a pure object literal.
const PRESET_META: Record<string, { description: string; title: string }> = (() => {
  const map: Record<string, { description: string; title: string }> = {};
  for (const p of PRESETS) {
    const plan = p.build();
    map[p.id] = { description: plan.description, title: plan.title };
  }
  return map;
})();

const CATEGORIES: PresetCategory[] = PRESET_CATEGORY_ORDER;

function isSpecialState(id: string): boolean {
  return id === "__loaded__" || id === "__generated__";
}

function initialTabFor(presetId: string): PresetCategory {
  const found = PRESETS.find((p) => p.id === presetId);
  if (found && PRESET_CATEGORY_ORDER.includes(found.category)) return found.category;
  return PRESET_CATEGORY_ORDER[0];
}

export function PresetPicker({ presetId, onPresetChange, disabled }: PresetPickerProps) {
  const [tab, setTab] = useState<PresetCategory>(() => initialTabFor(presetId));

  const byCategory = useMemo(() => {
    const map = new Map<PresetCategory, typeof PRESETS>();
    for (const cat of CATEGORIES) {
      map.set(
        cat,
        PRESETS.filter((p) => p.category === cat),
      );
    }
    return map;
  }, []);

  const items = byCategory.get(tab) ?? [];
  const stateLabel = presetId === "__generated__" ? "AI generated" : "Current plan";

  return (
    <div className="space-y-2.5" role="group" aria-label="Preset picker">
      <Tabs
        value={tab}
        defaultValue={tab}
        onValueChange={(v) => setTab(v as PresetCategory)}
      >
        <TabsList className="w-full bg-muted/70">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            const tint = CATEGORY_TINT[cat];
            return (
              <TabsTrigger
                key={cat}
                value={cat}
                className="flex-1 gap-1.5 data-[state=active]:shadow"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Icon className={cn("h-3.5 w-3.5", tab === cat && tint.icon)} />
                  <span className="hidden sm:inline">{PRESET_CATEGORY_LABELS[cat]}</span>
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      {isSpecialState(presetId) && (
        <div className="flex items-center gap-1.5 rounded-md border border-dashed border-border bg-muted/40 px-2 py-1 text-[10px] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-accent" />
          <span>{stateLabel} — pick a preset below to swap it in.</span>
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={`${PRESET_CATEGORY_LABELS[tab]} presets`}
        className="grid grid-cols-2 gap-2"
      >
        {items.map((p) => {
          const active = p.id === presetId;
          const meta = PRESET_META[p.id];
          const Icon = CATEGORY_ICON[p.category];
          const tint = CATEGORY_TINT[p.category];
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onPresetChange(p.id)}
              className={cn(
                "group relative overflow-hidden rounded-lg border p-2.5 text-left transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
                active
                  ? cn(
                      "border-transparent bg-card ring-2",
                      tint.ring,
                      "shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]",
                    )
                  : "border-border bg-card/60 hover:border-accent/40 hover:bg-card",
              )}
            >
              {/* Soft category glow — only on active or hover */}
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br to-transparent opacity-0 transition-opacity",
                  tint.glow,
                  active ? "opacity-100" : "group-hover:opacity-60",
                )}
              />
              <div className="flex items-start gap-2">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-muted/70",
                    active && tint.icon,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", active && tint.icon)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-medium text-foreground">{p.label}</div>
                  <div className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                    {meta?.description ?? meta?.title ?? ""}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
