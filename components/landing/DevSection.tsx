import { Terminal, GitBranch, Blocks, ShieldCheck } from "lucide-react";

const points = [
  { icon: Terminal, label: "Idiomatic GSAP, not markup soup." },
  { icon: GitBranch, label: "Plans are JSON — diff them, version them." },
  { icon: Blocks, label: "Drops into Next.js and React projects." },
  { icon: ShieldCheck, label: "Accessible by default, not by afterthought." },
];

export function DevSection() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">
            For developers
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Motion tooling that respects your codebase.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            MotionPlan generates real code — not a canvas export. Every plan is a versionable JSON
            document, every export is a component you own.
          </p>
        </div>
        <ul className="space-y-3">
          {points.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-start gap-3 rounded-md border border-border bg-card p-4"
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              <span className="text-sm">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
