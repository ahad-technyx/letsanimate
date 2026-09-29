import { Sparkles } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";
import { SUBJECT_ICONS } from "@/lib/animation/subjects";

function renderSubject(plan: AnimationPlan) {
  const s = plan.subject;
  if (!s) {
    return <Sparkles className="h-16 w-16" />;
  }
  if (s.kind === "icon") {
    const Icon = SUBJECT_ICONS[s.value] ?? Sparkles;
    return <Icon className="h-16 w-16" />;
  }
  if (s.kind === "emoji") {
    return (
      <span className="text-6xl leading-none" aria-hidden>
        {s.value}
      </span>
    );
  }
  return <span className="text-2xl font-semibold">{s.value}</span>;
}

export function SubjectPreview({ plan }: { plan: AnimationPlan }) {
  const label = plan.subject?.label ?? plan.subject?.value ?? "subject";
  const title = plan.title || "Animated subject";
  return (
    <section className="section flex min-h-[400px] flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">
        {plan.style} · {label}
      </p>
      <div className="target flex h-32 w-32 items-center justify-center rounded-xl border border-accent/40 bg-accent/10 text-accent shadow-lg shadow-accent/10">
        {renderSubject(plan)}
      </div>
      <h2 className="max-w-md text-sm text-muted-foreground">{title}</h2>
    </section>
  );
}
