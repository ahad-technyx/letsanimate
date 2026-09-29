import { ImageIcon } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";

const FALLBACK_HEADING = "Motion for the modern web.";
const FALLBACK_SUB = "A live preview of the animation plan, driven by GSAP.";

function elementLabels(plan: AnimationPlan): string[] {
  return plan.elements.map((el) => el.label ?? el.selector);
}

/**
 * Rich scene used by the hero, blank, and single-target presets.
 * Every selector referenced by a built-in preset must exist below so GSAP
 * can find at least one matching node and produce visible motion.
 */
export function HeroPreview({ plan }: { plan: AnimationPlan }) {
  const heading = plan.title || FALLBACK_HEADING;
  const subtitle = plan.description || FALLBACK_SUB;
  const cardLabels = elementLabels(plan).slice(0, 3);
  const cards = [0, 1, 2].map((i) => cardLabels[i] ?? `Card ${i + 1}`);

  return (
    <section className="section relative space-y-8 overflow-hidden p-8 text-left">
      {/* Parallax background layer (targeted by the Parallax preset). */}
      <div
        aria-hidden
        className="parallax-bg pointer-events-none absolute inset-0 -z-0
          bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.14),transparent_60%)]"
      />

      <div className="relative z-10 space-y-8">
        {/* Generic .target tile — animated by Fade Up/Down/Left/Right, Scale In, and Blank. */}
        <div className="flex items-center gap-3">
          <span className="target inline-flex h-9 items-center rounded-md border border-accent/40 bg-accent/15 px-3 font-mono text-xs text-accent">
            .target
          </span>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{plan.style}</p>
        </div>

        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {heading.split(/\s+/).map((w, i) => (
            <span key={`${w}-${i}`} className="word mr-2 inline-block">
              {w}
            </span>
          ))}
        </h1>

        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

        {/* Pinned content tile (targeted by the Pin Section preset). */}
        <div className="pinned-content rounded-md border border-dashed border-border bg-card/60 p-3 text-xs text-muted-foreground">
          <span className="font-mono">.pinned-content</span> — sits inside the pinned section
          during scroll.
        </div>

        <div className="flex gap-2">
          <a className="cta inline-flex h-9 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background">
            Get Started
          </a>
          <span className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm">
            Learn More
          </span>
        </div>

        <div className="hero-img flex h-40 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
        </div>

        <div className="cards grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((label, i) => (
            <div key={i} className="card rounded-md border border-border bg-card p-4">
              <div className="mb-3 h-16 rounded-md bg-muted" />
              <div className="truncate text-xs font-medium">{label}</div>
              <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
