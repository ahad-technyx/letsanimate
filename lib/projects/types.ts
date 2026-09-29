import type { AnimationFramework, AnimationPlan } from "@/types/animation";
import type { CodeTarget } from "@/lib/animation/code-generator";

/**
 * Attached reference image (design mock, product screenshot, sketch).
 * Stored inline as a data URL so the whole project stays in localStorage.
 */
export interface Screenshot {
  id: string;
  name: string;
  dataUrl: string;
  width: number;
  height: number;
  size: number; // bytes of the data URL payload
  addedAt: string;
}

/**
 * Persisted project record. The animation plan is the source of truth —
 * generatedCode is a snapshot of the last-copied target and can be re-derived
 * from `animationPlan` at any time.
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  animationPlan: AnimationPlan;
  framework: AnimationFramework;
  screenshots?: Screenshot[];
  generatedCode?: {
    target: CodeTarget;
    code: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  framework: AnimationFramework;
  elementCount: number;
  updatedAt: string;
}

export function toSummary(p: Project): ProjectSummary {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    framework: p.framework,
    elementCount: p.animationPlan.elements.length,
    updatedAt: p.updatedAt,
  };
}
