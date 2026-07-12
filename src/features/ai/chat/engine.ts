/**
 * @module features/ai/chat/engine
 *
 * The universal chat engine. This is the single entry point for all AI chat
 * completions in FlutterForge AI. It:
 *   1. Resolves the provider from the registry
 *   2. Merges system/developer/workspace prompts
 *   3. Delegates to the provider's chat() or stream() method
 *   4. Tracks token usage
 *   5. Normalises errors into AIError
 *
 * Every future AI feature (chat UI, agents, code generator, etc.) calls
 * this engine — never a provider directly.
 */

import type { ChatRequest, ChatResponse, ChatChunk } from "./types";
import type { ProviderId } from "@/features/ai/provider/types";
import { getProvider, initProvider } from "@/features/ai/provider/registry";
import { buildSystemPrompt } from "@/features/ai/prompt/builder";
import type { PromptContext } from "@/features/ai/prompt/types";
import { AIError } from "@/features/ai/errors";
import { uid } from "@/lib/utils";

export interface ChatEngineOptions {
  provider: ProviderId;
  model: string;
  messages: ChatRequest["messages"];
  /** Prompt context — merged into the system prompt by the builder. */
  promptContext?: PromptContext;
  /** Override the entire system prompt (bypasses the builder). */
  systemPrompt?: string;
  /** Developer-level instructions. */
  developerPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  stop?: string[];
  tools?: ChatRequest["tools"];
  reasoningEffort?: ChatRequest["reasoningEffort"];
  jsonSchema?: ChatRequest["jsonSchema"];
  /** Provider credentials (apiKey, baseUrl, etc.). */
  credentials?: { apiKey?: string; baseUrl?: string; headers?: Record<string, string> };
}

/**
 * Build a ChatRequest from engine options. Merges prompts, generates an id,
 * and resolves provider config. Used by both chat() and stream().
 */
export async function buildChatRequest(options: ChatEngineOptions): Promise<ChatRequest> {
  const provider = getProvider(options.provider);

  // Initialise the provider with credentials if provided.
  if (options.credentials || !provider.config) {
    await initProvider(options.provider, {
      provider: options.provider,
      apiKey: options.credentials?.apiKey,
      baseUrl: options.credentials?.baseUrl,
      headers: options.credentials?.headers,
    });
  }

  const systemPrompt =
    options.systemPrompt ?? buildSystemPrompt(options.promptContext);

  return {
    id: uid("chat"),
    provider: options.provider,
    model: options.model,
    messages: options.messages,
    systemPrompt,
    developerPrompt: options.developerPrompt,
    temperature: options.temperature,
    topP: options.topP,
    maxTokens: options.maxTokens,
    presencePenalty: options.presencePenalty,
    frequencyPenalty: options.frequencyPenalty,
    stop: options.stop,
    tools: options.tools,
    reasoningEffort: options.reasoningEffort,
    jsonSchema: options.jsonSchema,
  };
}

/**
 * Execute a non-streaming chat completion.
 */
export async function chat(options: ChatEngineOptions): Promise<ChatResponse> {
  const request = await buildChatRequest(options);
  const provider = getProvider(options.provider);
  return provider.chat(request);
}

/**
 * Execute a streaming chat completion. Returns an async iterable of chunks.
 * The caller (usually an SSE API route) forwards these to the client.
 */
export async function* stream(
  options: ChatEngineOptions
): AsyncIterable<ChatChunk> {
  const request = await buildChatRequest(options);
  const provider = getProvider(options.provider);
  yield* provider.stream(request);
}

/** Cancel an in-flight streaming request. */
export async function cancel(providerId: ProviderId, requestId: string): Promise<void> {
  const provider = getProvider(providerId);
  await provider.cancel(requestId);
}

/** Type guard for AIError (useful in catch blocks). */
export function isAIError(e: unknown): e is AIError {
  return e instanceof AIError;
}
