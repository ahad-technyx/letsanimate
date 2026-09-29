import "server-only";
import type { Project, ProjectSummary } from "./types";
import type { ProjectsRepository } from "./storage";

/**
 * Placeholder Supabase repository. To activate:
 *
 * 1. Install `@supabase/supabase-js`.
 * 2. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_ANON_KEY (client) or
 *    SUPABASE_SERVICE_ROLE_KEY (server) in .env.local.
 * 3. Apply the SQL schema below (create tables + RLS policies).
 * 4. Swap the default repository in `lib/projects/storage.ts`:
 *
 *      export function getProjectsRepository() {
 *        if (typeof window === "undefined" && process.env.SUPABASE_URL) {
 *          return new SupabaseProjectsRepository(...);
 *        }
 *        return new LocalProjectsRepository();
 *      }
 *
 * SQL schema (Postgres):
 *
 *   create table public.users (
 *     id uuid primary key default gen_random_uuid(),
 *     email text unique not null,
 *     created_at timestamptz default now()
 *   );
 *
 *   create table public.projects (
 *     id text primary key,
 *     user_id uuid references public.users(id) on delete cascade,
 *     name text not null,
 *     description text default '',
 *     framework text not null,
 *     animation_plan jsonb not null,
 *     generated_code jsonb,
 *     created_at timestamptz not null default now(),
 *     updated_at timestamptz not null default now()
 *   );
 *   create index projects_user_id_idx on public.projects (user_id, updated_at desc);
 *   alter table public.projects enable row level security;
 *   create policy "read own projects" on public.projects for select using (auth.uid() = user_id);
 *   create policy "write own projects" on public.projects for all using (auth.uid() = user_id);
 *
 *   create table public.animation_presets (
 *     id text primary key,
 *     name text not null,
 *     description text,
 *     animation_plan jsonb not null,
 *     created_by uuid references public.users(id),
 *     created_at timestamptz default now()
 *   );
 */
export class SupabaseProjectsRepository implements ProjectsRepository {
  readonly name = "supabase" as const;

  async list(): Promise<ProjectSummary[]> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
  async get(_id: string): Promise<Project | null> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
  async create(_project: Project): Promise<Project> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
  async update(_id: string, _patch: Partial<Project>): Promise<Project | null> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
  async delete(_id: string): Promise<void> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
  async duplicate(_id: string): Promise<Project | null> {
    throw new Error("SupabaseProjectsRepository is not implemented yet.");
  }
}
