"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  Copy as CopyIcon,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProjectsRepository } from "@/lib/projects/storage";
import type { ProjectSummary } from "@/lib/projects/types";

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(0, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function ProjectsList() {
  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);

  const refresh = useCallback(async () => {
    const repo = getProjectsRepository();
    setProjects(await repo.list());
  }, []);

  useEffect(() => {
    // Hydrate the list from localStorage on mount — legitimate external-source sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  const onDelete = async (id: string) => {
    if (!confirm("Delete this project? This cannot be undone.")) return;
    await getProjectsRepository().delete(id);
    void refresh();
  };

  const onDuplicate = async (id: string) => {
    await getProjectsRepository().duplicate(id);
    void refresh();
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Your Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Saved locally in your browser.
          </p>
        </div>
        <Link href="/app/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <div className="mt-8">
        {projects === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-lg border border-border bg-muted/40"
              />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-border p-12 text-center">
      <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-md border border-border bg-muted">
        <Sparkles className="h-4 w-4 text-accent" />
      </span>
      <h2 className="mt-4 text-sm font-semibold">No projects yet</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Start from a template to create your first animation plan.
      </p>
      <div className="mt-5 flex justify-center">
        <Link href="/app/new">
          <Button>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onDelete,
  onDuplicate,
}: {
  project: ProjectSummary;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="group relative flex flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent/50">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/app/project/${project.id}`} className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold group-hover:text-accent">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {project.description || "No description"}
          </p>
        </Link>
        <div className="relative">
          <button
            type="button"
            aria-label="Project actions"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => setMenuOpen((v) => !v)}
            onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-40 rounded-md border border-border bg-card shadow-md">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate(project.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs hover:bg-muted"
              >
                <CopyIcon className="h-3 w-3" />
                Duplicate
              </button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setMenuOpen(false);
                  onDelete(project.id);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-muted"
              >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Badge variant="outline">{project.framework}</Badge>
        <span className="font-mono text-[10px] text-muted-foreground">
          {relativeTime(project.updatedAt)}
        </span>
      </div>
      <Link
        href={`/app/project/${project.id}`}
        className="mt-3 text-xs font-medium text-accent hover:underline"
      >
        Open →
      </Link>
    </div>
  );
}
