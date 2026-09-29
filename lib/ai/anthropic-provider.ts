import "server-only";
import type { AIPlanRequest, AIPlanResponse, AIScreenshotInput } from "@/types/ai";
import { normalizePlan } from "@/lib/animation/utils";
import { safeValidatePlan, type ValidationResult } from "./schema";
import {
  buildPlanPrompt,
  buildRepairPrompt,
  systemPromptForMode,
} from "./prompts";
import type { AIProvider } from "./provider";

const ANTHROPIC_ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const REQUEST_TIMEOUT_MS = 30_000;

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface ImageBlock {
  type: "image";
  source: { type: "base64"; media_type: MediaType; data: string };
}
interface TextBlock {
  type: "text";
  text: string;
}
type ContentBlock = ImageBlock | TextBlock;

function parseDataUrl(dataUrl: string): { mediaType: MediaType; data: string } | null {
  const m = /^data:(image\/(?:png|jpe?g|gif|webp));base64,(.+)$/.exec(dataUrl);
  if (!m) return null;
  const raw = m[1].replace("jpg", "jpeg") as MediaType;
  return { mediaType: raw, data: m[2] };
}

/**
 * Fetch-based Anthropic Messages API provider. No SDK dependency.
 * Server-side only — `server-only` import will throw if imported from client code.
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic" as const;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async generatePlan(req: AIPlanRequest): Promise<AIPlanResponse> {
    const mode = req.mode ?? "2d";
    const systemPrompt = systemPromptForMode(mode);
    const userPrompt = buildPlanPrompt(req);
    const first = await this.call(systemPrompt, userPrompt, req.screenshots);
    const firstValid = this.tryParse(first);
    if (firstValid.ok) {
      return { plan: normalizePlan(firstValid.plan), reasoning: "First-shot valid." };
    }

    // Repair pass — don't resend the images, just the failed JSON.
    const repaired = await this.call(systemPrompt, buildRepairPrompt(first, firstValid.error));
    const repairedValid = this.tryParse(repaired);
    if (repairedValid.ok) {
      return {
        plan: normalizePlan(repairedValid.plan),
        reasoning: "Repaired after schema failure.",
        warnings: [`Initial output required repair: ${firstValid.error}`],
      };
    }

    throw new Error(`AI returned an invalid AnimationPlan: ${repairedValid.error}`);
  }

  private buildContent(userPrompt: string, screenshots?: AIScreenshotInput[]): ContentBlock[] {
    const blocks: ContentBlock[] = [];
    if (screenshots && screenshots.length > 0) {
      for (const shot of screenshots) {
        const parsed = parseDataUrl(shot.dataUrl);
        if (!parsed) continue;
        blocks.push({
          type: "image",
          source: { type: "base64", media_type: parsed.mediaType, data: parsed.data },
        });
      }
      blocks.push({
        type: "text",
        text: `${userPrompt}\n\n(The image${screenshots.length === 1 ? "" : "s"} above ${screenshots.length === 1 ? "is a" : "are"} design reference${screenshots.length === 1 ? "" : "s"}. Infer element selectors, layout, and timing from ${screenshots.length === 1 ? "it" : "them"}.)`,
      });
    } else {
      blocks.push({ type: "text", text: userPrompt });
    }
    return blocks;
  }

  private async call(
    systemPrompt: string,
    userPrompt: string,
    screenshots?: AIScreenshotInput[],
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(ANTHROPIC_ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: this.model,
          max_tokens: 4096,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [{ role: "user", content: this.buildContent(userPrompt, screenshots) }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = (await res.json()) as {
        content?: Array<{ type: string; text?: string }>;
      };
      const text = data.content?.find((b) => b.type === "text")?.text ?? "";
      if (!text) throw new Error("Empty AI response");
      return text;
    } finally {
      clearTimeout(timer);
    }
  }

  private tryParse(text: string): ValidationResult {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1) return { ok: false, error: "No JSON object in response" };
    const jsonStr = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(jsonStr);
      return safeValidatePlan(parsed);
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? `JSON parse error: ${e.message}` : "JSON parse error",
      };
    }
  }
}
