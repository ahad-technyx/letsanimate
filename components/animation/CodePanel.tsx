"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import type { AnimationPlan } from "@/types/animation";
import {
  TARGET_EXTENSION,
  TARGET_LABELS,
  TARGET_LANGUAGE,
  generateCode,
  type CodeTarget,
} from "@/lib/animation/code-generator";
import { tokenize } from "@/lib/animation/highlight";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TARGETS: CodeTarget[] = ["gsap", "gsap-scrolltrigger", "react", "nextjs", "css"];

const MIME: Record<string, string> = {
  js: "text/javascript",
  tsx: "text/plain",
  css: "text/css",
};

function planFilename(plan: AnimationPlan, ext: string): string {
  const slug = plan.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "animation"}.${ext}`;
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function CodePanel({ plan }: { plan: AnimationPlan }) {
  const [target, setTarget] = useState<CodeTarget>("react");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => generateCode(plan, target), [plan, target]);
  const lang = TARGET_LANGUAGE[target];
  const tokens = useMemo(() => tokenize(code, lang), [code, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be unavailable in insecure contexts */
    }
  };

  const onDownload = () => {
    const ext = TARGET_EXTENSION[target];
    downloadFile(planFilename(plan, ext), code, MIME[ext] ?? "text/plain");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>Target</span>
          <Select
            className="h-7 w-auto min-w-40 text-xs"
            value={target}
            onChange={(e) => setTarget(e.target.value as CodeTarget)}
          >
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {TARGET_LABELS[t]}
              </option>
            ))}
          </Select>
        </label>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onCopy} aria-label="Copy code">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDownload} aria-label="Download code">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </div>
      </div>

      <pre className="mp-code flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed">
        <code>
          {tokens.map((t, i) => (
            <span key={i} data-tok={t.kind}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}
