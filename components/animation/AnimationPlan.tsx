import type { AnimationPlan } from "@/types/animation";

function KeyValue({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-1.5 text-xs">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-mono text-foreground">{v}</span>
    </div>
  );
}

export function AnimationPlanTab({ plan }: { plan: AnimationPlan }) {
  return (
    <div className="p-4 text-sm">
      <div>
        <h3 className="text-sm font-semibold">{plan.title}</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{plan.description}</p>
      </div>

      <div className="mt-4">
        <KeyValue k="Style" v={plan.style} />
        <KeyValue k="Trigger" v={plan.trigger.type} />
        <KeyValue k="Framework" v={plan.framework} />
        <KeyValue k="Duration" v={`${plan.duration.toFixed(2)}s`} />
        <KeyValue k="Ease" v={plan.ease} />
        <KeyValue k="Elements" v={plan.elements.length} />
      </div>

      <h4 className="mt-6 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Elements
      </h4>
      <div className="mt-2 space-y-2">
        {plan.elements.map((el) => (
          <div
            key={el.id}
            className="rounded-md border border-border bg-card p-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{el.label ?? el.selector}</span>
              <span className="font-mono text-muted-foreground">{el.selector}</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-muted-foreground">
              <span>duration</span>
              <span className="text-right font-mono text-foreground">
                {el.timing.duration.toFixed(2)}s
              </span>
              <span>delay</span>
              <span className="text-right font-mono text-foreground">
                {(el.timing.delay ?? 0).toFixed(2)}s
              </span>
              {el.timing.stagger !== undefined && (
                <>
                  <span>stagger</span>
                  <span className="text-right font-mono text-foreground">
                    {el.timing.stagger.toFixed(2)}s
                  </span>
                </>
              )}
              <span>ease</span>
              <span className="text-right font-mono text-foreground">
                {el.timing.ease ?? plan.ease}
              </span>
            </div>
            {(el.from || el.to) && (
              <pre className="mt-2 overflow-auto rounded-sm bg-muted p-2 text-[10px] leading-relaxed">
                <code className="font-mono text-foreground/90">
                  {JSON.stringify({ from: el.from, to: el.to }, null, 2)}
                </code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
