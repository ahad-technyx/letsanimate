import { MessageSquare, Sparkles, Code2 } from "lucide-react";

const steps = [
  {
    icon: MessageSquare,
    step: "01",
    title: "Describe the animation",
    body: "Write what you want in plain language — a scroll reveal, a hero entrance, a card stagger.",
  },
  {
    icon: Sparkles,
    step: "02",
    title: "Get a structured plan",
    body: "MotionPlan turns your idea into elements, timing, easing, and accessibility guardrails.",
  },
  {
    icon: Code2,
    step: "03",
    title: "Ship production code",
    body: "Preview it, tweak the timeline, and copy GSAP or React code that drops into your project.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            From prompt to production in three steps.
          </h2>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          {steps.map(({ icon: Icon, step, title, body }) => (
            <div
              key={step}
              className="rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent/50"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                  <Icon className="h-4 w-4 text-accent" />
                </span>
                <span className="text-xs font-mono text-muted-foreground">{step}</span>
              </div>
              <h3 className="mt-6 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
