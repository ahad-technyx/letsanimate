import "server-only";
import type { AIPlanRequest, AIPlanResponse, AIProviderName } from "@/types/ai";

export interface AIProvider {
  readonly name: AIProviderName;
  generatePlan(request: AIPlanRequest): Promise<AIPlanResponse>;
}

/**
 * Server-only factory. Selects a provider based on environment:
 *   - AI_API_KEY set → AnthropicProvider
 *   - otherwise      → MockProvider (deterministic, no external calls)
 *
 * `AI_PROVIDER=mock` can force the mock even when a key is present.
 */
export async function getAIProvider(): Promise<AIProvider> {
  const forced = process.env.AI_PROVIDER;
  const apiKey = process.env.AI_API_KEY;

  if (forced === "mock" || !apiKey) {
    const { MockProvider } = await import("./mock-provider");
    return new MockProvider();
  }

  const { AnthropicProvider } = await import("./anthropic-provider");
  return new AnthropicProvider(apiKey, process.env.AI_MODEL);
}
