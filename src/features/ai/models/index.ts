/**
 * @module features/ai/models
 *
 * Model Manager — abstracts over model providers so the agent layer never
 * names a vendor directly. Planned providers (Phase 2):
 *  - OpenRouter (multi-vendor gateway)
 *  - Ollama (local models)
 *  - Z.ai SDK (in-house)
 *
 * Phase 1 ships only the types + a registry stub.
 */

export type ModelProvider = "openrouter" | "ollama" | "zai" | "custom";

export interface ModelDescriptor {
  id: string;
  provider: ModelProvider;
  name: string;
  contextWindow: number;
  capabilities: ModelCapability[];
  /** cost per 1M tokens (USD), if known */
  inputCostPer1M?: number;
  outputCostPer1M?: number;
}

export type ModelCapability =
  | "chat"
  | "code"
  | "vision"
  | "tool_use"
  | "streaming"
  | "embeddings";

export interface ChatCompletionRequest {
  modelId: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  stream?: boolean;
  temperature?: number;
  tools?: unknown[];
}

export interface ChatCompletionResponse {
  modelId: string;
  content: string;
  toolCalls?: unknown[];
  usage?: { promptTokens: number; completionTokens: number };
}

/** Registry of configured models. Empty in Phase 1. */
export const modelRegistry: ModelDescriptor[] = [];

/** Resolve a model by id. Stub — Phase 2 loads from provider configs. */
export function getModel(_id: string): ModelDescriptor | undefined {
  return undefined;
}

/** Send a chat completion. NOT IMPLEMENTED in Phase 1. */
export async function chatCompletion(
  _request: ChatCompletionRequest
): Promise<ChatCompletionResponse> {
  throw new Error(
    "Model manager is not implemented in Phase 1. Provider routing arrives in Phase 2."
  );
}
