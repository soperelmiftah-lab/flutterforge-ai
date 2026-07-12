/**
 * @module features/integrations/ollama
 *
 * Ollama adapter — runs models locally via the Ollama runtime. Planned (Phase 2).
 */

export interface OllamaConfig {
  baseUrl: string; // e.g. http://localhost:11434
  defaultModel?: string;
}

export const ollamaConfig: OllamaConfig | null = null;

/** Configure the Ollama adapter. NOT IMPLEMENTED in Phase 1. */
export async function configureOllama(_config: OllamaConfig): Promise<void> {
  throw new Error("Ollama integration arrives in Phase 2.");
}
