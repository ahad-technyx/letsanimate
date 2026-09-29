export type AdvisorStatus = "good" | "warning" | "critical";

export interface AdvisorIssue {
  id: string;
  severity: AdvisorStatus;
  title: string;
  message: string;
  selector?: string;
}

export interface AdvisorResult {
  status: AdvisorStatus;
  issues: AdvisorIssue[];
  recommendations: string[];
}

export function worstOf(a: AdvisorStatus, b: AdvisorStatus): AdvisorStatus {
  const rank: Record<AdvisorStatus, number> = { good: 0, warning: 1, critical: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function statusFrom(issues: AdvisorIssue[]): AdvisorStatus {
  if (issues.some((i) => i.severity === "critical")) return "critical";
  if (issues.some((i) => i.severity === "warning")) return "warning";
  return "good";
}

export function numOr0(v: unknown): number {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    if (!seen.has(s)) {
      seen.add(s);
      out.push(s);
    }
  }
  return out;
}
