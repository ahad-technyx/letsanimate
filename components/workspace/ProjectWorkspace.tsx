"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { WorkspaceShell } from "./WorkspaceShell";
import { getProjectsRepository } from "@/lib/projects/storage";
import type { Project } from "@/lib/projects/types";
import { Button } from "@/components/ui/button";

const SAVE_DEBOUNCE_MS = 400;

type SaveState = "saved" | "saving" | "idle";

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProjectsRepository()
      .get(projectId)
      .then((p) => {
        if (cancelled) return;
        if (!p) setNotFound(true);
        else setProject(p);
      });
    return () => {
      cancelled = true;
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [projectId]);

  const onProjectChange = useCallback(
    (next: Project) => {
      setProject(next);
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void getProjectsRepository()
          .update(next.id, {
            name: next.name,
            description: next.description,
            animationPlan: next.animationPlan,
            framework: next.framework,
            generatedCode: next.generatedCode,
          })
          .then((saved) => {
            if (saved) setSaveState("saved");
          });
      }, SAVE_DEBOUNCE_MS);
    },
    [],
  );

  if (notFound) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle className="h-6 w-6 text-yellow-500" />
        <div>
          <h1 className="text-lg font-semibold">Project not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Projects are stored in your browser — it may have been cleared.
          </p>
        </div>
        <Link href="/app">
          <Button>Back to projects</Button>
        </Link>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <span className="text-sm">Loading project…</span>
      </main>
    );
  }

  return (
    <WorkspaceShell project={project} onProjectChange={onProjectChange} saveState={saveState} />
  );
}
