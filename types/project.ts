import type { AnimationPlan } from "./animation";

export interface Project {
  id: string;
  name: string;
  description?: string;
  plans: AnimationPlan[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  planCount: number;
  updatedAt: string;
}
