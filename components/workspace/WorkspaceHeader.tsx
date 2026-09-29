"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Download, FileDown, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Project } from "@/lib/projects/types";
import { getProjectsRepository } from "@/lib/projects/storage";

type SaveState = "saved" | "saving" | "idle";

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

function slug(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "animation"
  );
}

export function WorkspaceHeader({
  project,
  onProjectChange,
  saveState,
}: {
  project: Project;
  onProjectChange: (next: Project) => void;
  saveState: SaveState;
}) {
  const router = useRouter();
  const [renaming, setRenaming] = useState(false);
  const [draftName, setDraftName] = useState(project.name);

  const commitRename = () => {
    setRenaming(false);
    const trimmed = draftName.trim();
    if (trimmed.length === 0 || trimmed === project.name) {
      setDraftName(project.name);
      return;
    }
    onProjectChange({ ...project, name: trimmed });
  };

  const onDelete = async () => {
    if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
    await getProjectsRepository().delete(project.id);
    router.push("/app");
  };

  const onExportJson = () => {
    const payload = JSON.stringify(project.animationPlan, null, 2);
    downloadFile(`${slug(project.name)}.plan.json`, payload, "application/json");
  };

  return (
    <header className="flex h-12 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-background px-4">
      <div className="flex items-center gap-3">
        <Link href="/app" className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-accent" />
          MotionPlan
        </Link>
        <span className="text-muted-foreground">/</span>
        {renaming ? (
          <input
            type="text"
            autoFocus
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setDraftName(project.name);
                setRenaming(false);
              }
            }}
            className="h-7 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Project name"
          />
        ) : (
          <button
            type="button"
            onClick={() => {
              setDraftName(project.name);
              setRenaming(true);
            }}
            className="rounded-md px-2 py-1 text-sm hover:bg-muted"
            title="Rename project"
          >
            {project.name}
          </button>
        )}
        <SaveIndicator state={saveState} />
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onExportJson} title="Download plan JSON">
          <FileDown className="h-4 w-4" />
          JSON
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="text-rose-500 hover:text-rose-500"
          title="Delete project"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state === "saving") {
    return (
      <Badge variant="muted" className="gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving…
      </Badge>
    );
  }
  if (state === "saved") {
    return (
      <Badge variant="muted" className="gap-1 text-emerald-500">
        <Check className="h-3 w-3" />
        Saved
      </Badge>
    );
  }
  return null;
}

// Preserve the Download icon import so tree-shaking is deterministic.
void Download;
