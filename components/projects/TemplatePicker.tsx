"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getProjectsRepository, newProjectId } from "@/lib/projects/storage";
import { PROJECT_TEMPLATES } from "@/lib/projects/templates";
import type { Project } from "@/lib/projects/types";

export function TemplatePicker() {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  const onPick = async (templateId: string) => {
    setPending(templateId);
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId);
    if (!template) {
      setPending(null);
      return;
    }
    const plan = template.build();
    const now = new Date().toISOString();
    const project: Project = {
      id: newProjectId(),
      name: template.id === "blank" ? "Untitled Plan" : plan.title,
      description: plan.description,
      framework: plan.framework,
      animationPlan: plan,
      createdAt: now,
      updatedAt: now,
    };
    await getProjectsRepository().create(project);
    router.push(`/app/project/${project.id}`);
  };

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <Link
        href="/app"
        className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to projects
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Choose a starting point</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Pick a template. Everything can be edited afterwards.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TEMPLATES.map((t) => {
          const isPending = pending === t.id;
          return (
            <button
              key={t.id}
              type="button"
              disabled={pending !== null}
              onClick={() => onPick(t.id)}
              className="group flex h-full flex-col justify-between rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-accent/50 disabled:pointer-events-none disabled:opacity-60"
            >
              <div>
                <h3 className="text-sm font-semibold group-hover:text-accent">{t.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-accent">
                {isPending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>Use template →</>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </main>
  );
}
