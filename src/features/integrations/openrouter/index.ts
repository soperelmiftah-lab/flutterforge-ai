/**
 * @module features/integrations/openrouter
 *
 * OpenRouter adapter — routes completions across many model vendors through a
 * single API key. Planned (Phase 2).
 */

export interface OpenRouterConfig {
  apiKey: string;
  defaultModel?: string;
  baseUrl?: string;
}

export const openRouterConfig: OpenRouterConfig | null = null;

/** Configure the OpenRouter adapter. NOT IMPLEMENTED in Phase 1. */
export async function configureOpenRouter(_config: OpenRouterConfig): Promise<void> {
  throw new Error("OpenRouter integration arrives in Phase 2.");
}
