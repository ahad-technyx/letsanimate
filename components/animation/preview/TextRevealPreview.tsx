import type { AnimationPlan } from "@/types/animation";

const FALLBACK = "Reveal the words in a beautiful cinematic sequence.";

export function TextRevealPreview({ plan }: { plan: AnimationPlan }) {
  const source = plan.title || plan.description || FALLBACK;
  const words = source.split(/\s+/).filter(Boolean);
  return (
    <section className="section flex min-h-[300px] flex-col justify-center p-8">
      <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">
        {plan.style} · text reveal
      </p>
      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
        {words.map((w, i) => (
          <span key={`${w}-${i}`} className="word mr-2 inline-block">
            {w}
          </span>
        ))}
      </h1>
    </section>
  );
}
