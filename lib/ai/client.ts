import type { AIPlanRequest, GenerateApiResponse, GenerateErrorCode } from "@/types/ai";
import type { AnimationPlan } from "@/types/animation";

export class GenerationError extends Error {
  code: GenerateErrorCode;
  constructor(message: string, code: GenerateErrorCode) {
    super(message);
    this.name = "GenerationError";
    this.code = code;
  }
}

export async function generateAnimationPlan(req: AIPlanRequest): Promise<AnimationPlan> {
  let res: Response;
  try {
    res = await fetch("/api/animation/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new GenerationError("Network error. Check your connection and try again.", "network");
  }

  let data: GenerateApiResponse;
  try {
    data = (await res.json()) as GenerateApiResponse;
  } catch {
    throw new GenerationError("Received an unreadable response from the server.", "unknown");
  }

  if (!data.ok) throw new GenerationError(data.error, data.code);
  return data.plan;
}
