import type { AnimationPlan } from "@/types/animation";

export function HorizontalScrollPreview({ plan }: { plan: AnimationPlan }) {
  const title = plan.title || "Horizontal scroll";
  return (
    <section className="section hscroll relative min-h-[80vh] overflow-hidden p-0">
      <div className="sticky top-0 flex h-[80vh] flex-col justify-center">
        <div className="mb-4 pl-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">{plan.style}</p>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        <div className="hscroll-row flex gap-4 pl-8 will-change-transform">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="hscroll-item flex h-64 w-72 shrink-0 items-end rounded-md border border-border bg-card p-4"
            >
              <div>
                <div className="h-3 w-24 rounded bg-muted" />
                <div className="mt-2 h-3 w-16 rounded bg-muted" />
                <p className="mt-4 font-mono text-xs text-muted-foreground">
                  {title.split(/\s+/)[0].toLowerCase()} / {String(i + 1).padStart(2, "0")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
