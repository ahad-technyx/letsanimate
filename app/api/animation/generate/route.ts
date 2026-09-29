import { NextResponse } from "next/server";
import { z } from "zod";
import { getAIProvider } from "@/lib/ai/provider";
import { AnimationFrameworkSchema, AnimationStyleSchema } from "@/lib/ai/schema";
import type { GenerateApiResponse, GenerateErrorCode } from "@/types/ai";

export const runtime = "nodejs";

const ScreenshotSchema = z.object({
  name: z.string().max(200).optional(),
  dataUrl: z
    .string()
    .regex(/^data:image\/(png|jpe?g|gif|webp);base64,/, "Unsupported image data URL."),
});

const RequestSchema = z.object({
  prompt: z.string().trim().min(3, "Prompt is too short.").max(2000, "Prompt is too long."),
  style: AnimationStyleSchema.optional(),
  trigger: z.enum(["onLoad", "onScroll", "onHover", "onClick", "onInView"]).optional(),
  framework: AnimationFrameworkSchema.optional(),
  screenshots: z.array(ScreenshotSchema).max(4).optional(),
});

function json(body: GenerateApiResponse, status = 200) {
  return NextResponse.json(body, { status });
}

function classifyError(msg: string): GenerateErrorCode {
  if (/invalid animationplan|invalid output/i.test(msg)) return "invalid_output";
  if (/abort|timeout/i.test(msg)) return "timeout";
  if (/api key|missing key|401|403/i.test(msg)) return "missing_key";
  if (/fetch failed|network|ENOTFOUND|ECONNREFUSED/i.test(msg)) return "network";
  return "ai_failure";
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body.", code: "invalid_input" }, 400);
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const isEmpty =
      issue?.path.join(".") === "prompt" && /too short|required|min/i.test(issue.message);
    return json(
      {
        ok: false,
        error: issue?.message ?? "Invalid input.",
        code: isEmpty ? "empty_prompt" : "invalid_input",
      },
      400,
    );
  }

  try {
    const provider = await getAIProvider();
    const result = await provider.generatePlan(parsed.data);
    return json({
      ok: true,
      plan: result.plan,
      provider: provider.name,
      warnings: result.warnings,
    });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Unknown error";
    console.error("[generate] provider error:", raw);
    const code = classifyError(raw);
    const userMessage =
      code === "timeout"
        ? "The AI took too long to respond. Try again."
        : code === "network"
          ? "Network error contacting the AI. Try again."
          : code === "missing_key"
            ? "AI provider not configured on the server."
            : code === "invalid_output"
              ? "The AI produced an invalid animation plan. Try rephrasing."
              : "The AI could not generate a plan for that prompt.";
    return json({ ok: false, error: userMessage, code }, 502);
  }
}
