import { Badge } from "@/components/ui/badge";

const tracks = [
  { label: "Heading", start: 0, width: 34, color: "bg-accent" },
  { label: "Image", start: 14, width: 34, color: "bg-emerald-500" },
  { label: "CTA", start: 30, width: 26, color: "bg-fuchsia-500" },
  { label: "Cards", start: 44, width: 46, color: "bg-sky-500" },
];

export function ExampleAnimation() {
  return (
    <section id="example" className="scroll-mt-20 border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-accent">Example</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
              What MotionPlan produces.
            </h2>
          </div>
          <Badge variant="muted" className="hidden sm:inline-flex">
            hero-reveal.plan.json
          </Badge>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-red-500/70" />
              <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
              <span className="h-2 w-2 rounded-full bg-green-500/70" />
              <span className="ml-2 font-mono">preview.tsx</span>
            </div>
            <div className="rounded-md border border-border bg-background p-8 text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Hero</p>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight">
                Motion for the modern web.
              </h3>
              <p className="mx-auto mt-3 max-w-sm text-sm text-muted-foreground">
                A structured preview of the animation plan, generated from a single prompt.
              </p>
            </div>

            <div className="mt-6 space-y-2">
              {tracks.map((t) => (
                <div key={t.label} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 text-xs text-muted-foreground">{t.label}</span>
                  <div className="relative h-3 flex-1 overflow-hidden rounded-sm bg-muted">
                    <div
                      className={`absolute top-0 h-full rounded-sm ${t.color}/70`}
                      style={{ left: `${t.start}%`, width: `${t.width}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
              plan.json
            </div>
            <pre className="overflow-auto p-4 text-xs leading-relaxed">
              <code className="font-mono text-foreground/90">{`{
  "name": "Hero reveal",
  "framework": "gsap",
  "trigger": { "type": "onLoad" },
  "elements": [
    { "selector": "h1", "from": { "y": 24, "opacity": 0 },
      "to": { "y": 0, "opacity": 1 },
      "timing": { "duration": 0.7, "ease": "power3.out" } },
    { "selector": ".hero-img", "from": { "opacity": 0 },
      "to": { "opacity": 1 },
      "timing": { "duration": 0.6, "delay": 0.2 } },
    { "selector": ".cta", "from": { "y": 8, "opacity": 0 },
      "to": { "y": 0, "opacity": 1 },
      "timing": { "duration": 0.5, "delay": 0.35 } }
  ]
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
