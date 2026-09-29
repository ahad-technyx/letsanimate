import type { AnimationPlan } from "@/types/animation";

export function CardsPreview({ plan }: { plan: AnimationPlan }) {
  const title = plan.title || "Grid";
  const cardEl = plan.elements.find((e) => /\.card\b/.test(e.selector));
  const baseLabel = cardEl?.label ?? "Card";
  return (
    <section className="section p-8">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{plan.style}</p>
      <h2 className="mt-1 mb-6 text-lg font-semibold tracking-tight">{title}</h2>
      <div className="cards grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card rounded-md border border-border bg-card p-4">
            <div className="mb-3 h-16 rounded-md bg-muted" />
            <div className="truncate text-xs font-medium">
              {baseLabel} {i + 1}
            </div>
            <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
          </div>
        ))}
      </div>
    </section>
  );
}
