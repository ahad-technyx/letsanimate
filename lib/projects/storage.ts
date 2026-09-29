import type { Project, ProjectSummary } from "./types";
import { toSummary } from "./types";

/**
 * Storage abstraction. UI depends on this interface only — never on a specific
 * backend. Swap in a Supabase implementation without touching components.
 */
export interface ProjectsRepository {
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<Project | null>;
  create(project: Project): Promise<Project>;
  update(id: string, patch: Partial<Project>): Promise<Project | null>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<Project | null>;
}

const STORAGE_KEY = "motionplan.projects.v1";

interface StoredIndex {
  [id: string]: Project;
}

function readStore(): StoredIndex {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") return parsed as StoredIndex;
    return {};
  } catch {
    return {};
  }
}

function writeStore(store: StoredIndex): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota exceeded / private mode — swallow so UI doesn't crash */
  }
}

function uid(prefix = "proj"): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export class LocalProjectsRepository implements ProjectsRepository {
  readonly name = "local" as const;

  async list(): Promise<ProjectSummary[]> {
    const store = readStore();
    return Object.values(store)
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map(toSummary);
  }

  async get(id: string): Promise<Project | null> {
    const store = readStore();
    return store[id] ?? null;
  }

  async create(project: Project): Promise<Project> {
    const store = readStore();
    store[project.id] = project;
    writeStore(store);
    return project;
  }

  async update(id: string, patch: Partial<Project>): Promise<Project | null> {
    const store = readStore();
    const current = store[id];
    if (!current) return null;
    const next: Project = { ...current, ...patch, id, updatedAt: new Date().toISOString() };
    store[id] = next;
    writeStore(store);
    return next;
  }

  async delete(id: string): Promise<void> {
    const store = readStore();
    delete store[id];
    writeStore(store);
  }

  async duplicate(id: string): Promise<Project | null> {
    const store = readStore();
    const source = store[id];
    if (!source) return null;
    const now = new Date().toISOString();
    const copy: Project = {
      ...source,
      id: uid(),
      name: `${source.name} (copy)`,
      createdAt: now,
      updatedAt: now,
    };
    store[copy.id] = copy;
    writeStore(store);
    return copy;
  }
}

let repository: ProjectsRepository | null = null;

/**
 * Returns the active repository. LocalStorage by default; when Supabase is
 * configured, wire the SupabaseProjectsRepository here.
 */
export function getProjectsRepository(): ProjectsRepository {
  if (!repository) repository = new LocalProjectsRepository();
  return repository;
}

export { uid as newProjectId };
