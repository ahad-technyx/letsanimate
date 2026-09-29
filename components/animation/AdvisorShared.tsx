import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import type { AdvisorIssue, AdvisorStatus } from "@/lib/animation/advisor";
import { cn } from "@/lib/utils";

export const STATUS_LABEL: Record<AdvisorStatus, string> = {
  good: "Good",
  warning: "Warning",
  critical: "Critical",
};

export const STATUS_ICON: Record<AdvisorStatus, React.ComponentType<{ className?: string }>> = {
  good: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
};

export const STATUS_TONE: Record<AdvisorStatus, string> = {
  good: "text-emerald-500",
  warning: "text-yellow-500",
  critical: "text-rose-500",
};

export const STATUS_BG: Record<AdvisorStatus, string> = {
  good: "bg-emerald-500/10 border-emerald-500/30",
  warning: "bg-yellow-500/10 border-yellow-500/30",
  critical: "bg-rose-500/10 border-rose-500/30",
};

export function StatusHeader({
  status,
  title,
}: {
  status: AdvisorStatus;
  title: string;
}) {
  const Icon = STATUS_ICON[status];
  return (
    <div className={cn("flex items-center gap-2 rounded-md border px-3 py-2", STATUS_BG[status])}>
      <Icon className={cn("h-4 w-4", STATUS_TONE[status])} />
      <div className="flex-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className={cn("text-[11px] font-mono", STATUS_TONE[status])}>
          {STATUS_LABEL[status]}
        </p>
      </div>
    </div>
  );
}

export function IssueList({ issues }: { issues: AdvisorIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {issues.map((issue) => {
        const Icon = STATUS_ICON[issue.severity];
        return (
          <li
            key={issue.id}
            className="flex items-start gap-2 rounded-sm border border-border/60 bg-card p-2 text-xs"
          >
            <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", STATUS_TONE[issue.severity])} />
            <div className="min-w-0">
              <p className="font-medium">{issue.title}</p>
              <p className="text-muted-foreground">{issue.message}</p>
              {issue.selector && (
                <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
                  {issue.selector}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RecommendationList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1 text-xs">
      {items.map((rec, i) => (
        <li key={i} className="flex items-start gap-2 text-muted-foreground">
          <Info className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
          <span className="text-foreground/80">{rec}</span>
        </li>
      ))}
    </ul>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
      {children}
    </p>
  );
}
