import {
  Wand2,
  LineChart,
  Accessibility,
  MonitorSmartphone,
  Timer,
  FileCode2,
} from "lucide-react";

const features = [
  {
    icon: Wand2,
    title: "AI animation planner",
    body: "Prompt-to-plan with element-level timing, easing, and triggers you can edit.",
  },
  {
    icon: Timer,
    title: "Visual timeline",
    body: "A real timeline view — drag, scrub, and re-order motion tracks like a video editor.",
  },
  {
    icon: FileCode2,
    title: "Production code",
    body: "Export idiomatic GSAP or React code with proper cleanup and context usage.",
  },
  {
    icon: LineChart,
    title: "Performance advisor",
    body: "Warnings on layout thrash, expensive filters, and jank before you ship.",
  },
  {
    icon: Accessibility,
    title: "Accessibility advisor",
    body: "Respect prefers-reduced-motion, focus management, and ARIA implications by default.",
  },
  {
    icon: MonitorSmartphone,
    title: "Responsive advisor",
    body: "Preview at desktop, tablet, and mobile with per-breakpoint overrides.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-border/60">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 max-w-xl">
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Features</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for developers who care about motion.
          </h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card p-6">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background">
                <Icon className="h-4 w-4 text-accent" />
              </span>
              <h3 className="mt-5 text-sm font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
