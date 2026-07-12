/**
 * @module features/ai/provider/forge
 *
 * Forge provider — the built-in, zero-config provider powered by the Z.ai SDK.
 *
 * This is NOT one of the 8 spec-listed providers; it's a bonus built-in so
 * FlutterForge AI works out of the box without requiring the user to obtain
 * an API key. The default provider is still OpenRouter (per spec). Forge is
 * the always-available fallback for immediate experimentation.
 *
 * The SDK follows the OpenAI Chat Completions format, so this provider
 * translates between our universal types and the SDK's interface.
 *
 * IMPORTANT: z-ai-web-dev-sdk must only be used server-side.
 */

import type {
  AIProvider,
  ProviderConfig,
  ProviderMeta,
  HealthStatus,
} from "@/features/ai/provider/types";
import type { ModelDescriptor } from "@/features/ai/models/types";
import type {
  ChatRequest,
  ChatResponse,
  ChatChunk,
  ChatMessage,
} from "@/features/ai/chat/types";
import { AIError, aiErrors } from "@/features/ai/errors";

/** Static model catalog for the Forge provider. */
const FORGE_MODELS: ModelDescriptor[] = [
  {
    id: "glm-4.6",
    provider: "forge",
    name: "GLM-4.6 (Built-in)",
    contextLength: 131_072,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    capabilities: {
      vision: true,
      toolCalling: true,
      json: true,
      streaming: true,
      reasoning: true,
      image: false,
      audio: false,
      embedding: false,
      functionCalling: true,
    },
    maxOutputTokens: 8192,
    description:
      "Built-in model powered by the Z.ai SDK. No API key required — works out of the box.",
  },
  {
    id: "glm-4.5",
    provider: "forge",
    name: "GLM-4.5 (Built-in)",
    contextLength: 131_072,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    isFree: true,
    capabilities: {
      vision: false,
      toolCalling: true,
      json: true,
      streaming: true,
      reasoning: false,
      image: false,
      audio: false,
      embedding: false,
      functionCalling: true,
    },
    maxOutputTokens: 8192,
    description: "Fast built-in model for everyday coding tasks.",
  },
];

export const forgeMeta: ProviderMeta = {
  id: "forge",
  name: "Forge (Built-in)",
  description:
    "Zero-config built-in provider. Works immediately without an API key — perfect for trying FlutterForge AI.",
  requiresApiKey: false,
  isBuiltIn: true,
  implemented: true,
  icon: "⚡",
};

/**
 * ForgeProvider — wraps the z-ai-web-dev-sdk. No user credentials needed.
 */
export class ForgeProvider implements AIProvider {
  readonly meta = forgeMeta;
  config: ProviderConfig | null = null;

  // Lazily initialised SDK instance (loaded on first use).
  private sdk: any = null;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = { provider: "forge", ...config };
  }

  private async getSdk(): Promise<any> {
    if (this.sdk) return this.sdk;
    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      this.sdk = await ZAI.create();
      return this.sdk;
    } catch (e: unknown) {
      throw aiErrors.unknown(`Failed to initialise Forge SDK: ${String(e)}`, {
        provider: "forge",
      });
    }
  }

  async models(): Promise<ModelDescriptor[]> {
    return [...FORGE_MODELS];
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const sdk = await this.getSdk();
    const messages = this.assembleMessages(request);
    try {
      const response = await sdk.chat.completions.create({
        model: request.model,
        messages,
        temperature: request.temperature,
        top_p: request.topP,
        max_tokens: request.maxTokens,
        stream: false,
      });
      const choice = response.choices?.[0];
      return {
        id: response.id ?? request.id,
        requestId: request.id,
        model: response.model ?? request.model,
        provider: "forge",
        content: choice?.message?.content ?? "",
        finishReason: choice?.finish_reason === "stop" ? "stop" : undefined,
        usage: response.usage
          ? {
              inputTokens: response.usage.prompt_tokens ?? 0,
              outputTokens: response.usage.completion_tokens ?? 0,
              totalTokens: response.usage.total_tokens ?? 0,
            }
          : undefined,
      };
    } catch (e: unknown) {
      throw this.wrapError(e, request.id);
    }
  }

  async *stream(request: ChatRequest): AsyncIterable<ChatChunk> {
    const sdk = await this.getSdk();
    const messages = this.assembleMessages(request);
    try {
      const stream = await sdk.chat.completions.create({
        model: request.model,
        messages,
        temperature: request.temperature,
        top_p: request.topP,
        max_tokens: request.maxTokens,
        stream: true,
      });

      // The z-ai SDK yields raw SSE text chunks (Uint8Array). We decode and
      // parse the SSE frames manually, same as the OpenRouter provider.
      const decoder = new TextDecoder();
      let buffer = "";
      let totalContent = "";

      for await (const raw of stream) {
        // Handle both raw bytes and pre-parsed objects.
        let text: string;
        if (typeof raw === "string") {
          text = raw;
        } else if (raw instanceof Uint8Array) {
          text = decoder.decode(raw, { stream: true });
        } else if (raw && typeof raw === "object") {
          // Some SDK versions may yield parsed objects — handle gracefully.
          const delta = (raw as any)?.choices?.[0]?.delta?.content;
          if (delta) {
            totalContent += delta;
            yield { type: "delta", content: delta, requestId: request.id };
          }
          continue;
        } else {
          continue;
        }

        buffer += text;
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            yield { type: "done", finishReason: "stop", requestId: request.id };
            return;
          }
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              totalContent += delta;
              yield { type: "delta", content: delta, requestId: request.id };
            }
            const finish = chunk.choices?.[0]?.finish_reason;
            if (finish) {
              if (chunk.usage) {
                yield {
                  type: "usage",
                  usage: {
                    inputTokens: chunk.usage.prompt_tokens ?? 0,
                    outputTokens: chunk.usage.completion_tokens ?? 0,
                    totalTokens: chunk.usage.total_tokens ?? 0,
                  },
                  requestId: request.id,
                };
              }
              yield { type: "done", finishReason: "stop", requestId: request.id };
              return;
            }
          } catch {
            // Skip malformed JSON in partial frames.
          }
        }
      }

      // Flush remaining buffer.
      if (buffer.trim()) {
        const lines = buffer.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]" || !data) continue;
          try {
            const chunk = JSON.parse(data);
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) {
              yield { type: "delta", content: delta, requestId: request.id };
            }
          } catch {
            /* ignore */
          }
        }
      }

      yield { type: "done", finishReason: "stop", requestId: request.id };
    } catch (e: unknown) {
      throw this.wrapError(e, request.id);
    }
  }

  async health(): Promise<HealthStatus> {
    const checkedAt = new Date().toISOString();
    try {
      await this.getSdk();
      return { provider: "forge", status: "healthy", checkedAt };
    } catch {
      return { provider: "forge", status: "down", message: "SDK unavailable", checkedAt };
    }
  }

  async cancel(_requestId: string): Promise<void> {
    // The SDK doesn't expose cancellation yet — streaming will end on disconnect.
  }

  // --- internals ---

  private assembleMessages(request: ChatRequest): Array<Record<string, unknown>> {
    const out: Array<Record<string, unknown>> = [];
    if (request.systemPrompt) out.push({ role: "system", content: request.systemPrompt });
    if (request.developerPrompt) out.push({ role: "developer", content: request.developerPrompt });
    for (const m of request.messages) {
      out.push({ role: m.role, content: m.content });
    }
    return out;
  }

  private wrapError(e: unknown, requestId: string): AIError {
    if (e instanceof AIError) return e;
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("rate") || msg.includes("429")) return aiErrors.rateLimit({ provider: "forge", requestId });
    if (msg.includes("timeout")) return aiErrors.timeout({ provider: "forge", requestId });
    return aiErrors.unknown(msg, { provider: "forge", requestId });
  }
}
