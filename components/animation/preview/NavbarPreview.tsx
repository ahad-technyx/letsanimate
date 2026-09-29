import { Sparkles } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";

const DEFAULT_ITEMS = ["Features", "How it works", "Docs"];

export function NavbarPreview({ plan }: { plan: AnimationPlan }) {
  const brand = plan.title?.split(/\s+/).slice(0, 2).join(" ") || "MotionPlan";
  const navEl = plan.elements.find((e) => /\.nav-item/.test(e.selector));
  const items = navEl?.label
    ? navEl.label.split(/[,·|]/).map((s) => s.trim()).filter(Boolean)
    : DEFAULT_ITEMS;
  return (
    <section className="section min-h-[240px] p-8">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">{plan.style}</p>
      <header className="navbar flex items-center justify-between rounded-md border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="brand truncate">{brand}</span>
        </div>
        <nav className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          {items.map((item, i) => (
            <span key={i} className="nav-item">
              {item}
            </span>
          ))}
        </nav>
        <span className="cta inline-flex h-8 items-center rounded-md bg-foreground px-3 text-xs font-medium text-background">
          Open
        </span>
      </header>
      <p className="mt-6 text-xs text-muted-foreground">{plan.description}</p>
    </section>
  );
}
