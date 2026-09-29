import type {
  AnimationFramework,
  AnimationMode,
  AnimationPlan,
  AnimationStyle,
  TriggerKind,
} from "./animation";

export interface AIScreenshotInput {
  name?: string;
  dataUrl: string; // data:image/*;base64,...
}

export interface AIPlanRequest {
  prompt: string;
  /**
   * Animation dimension to generate for. Defaults to "2d". When "3d",
   * the provider swaps to the Three.js system prompt and the mock provider
   * returns a plan targeting Three.js meshes.
   */
  mode?: AnimationMode;
  style?: AnimationStyle;
  trigger?: TriggerKind;
  framework?: AnimationFramework;
  screenshots?: AIScreenshotInput[];
  context?: {
    projectId?: string;
    existingPlan?: AnimationPlan;
  };
}

export interface AIPlanResponse {
  plan: AnimationPlan;
  reasoning?: string;
  warnings?: string[];
}

export type AIProviderName = "anthropic" | "openai" | "mock";

export type GenerateApiResponse =
  | { ok: true; plan: AnimationPlan; provider: AIProviderName; warnings?: string[] }
  | { ok: false; error: string; code: GenerateErrorCode };

export type GenerateErrorCode =
  | "empty_prompt"
  | "invalid_input"
  | "ai_failure"
  | "invalid_output"
  | "timeout"
  | "missing_key"
  | "network"
  | "unknown";
