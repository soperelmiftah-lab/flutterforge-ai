/**
 * @module features/ai/provider/openrouter
 *
 * OpenRouter provider — the DEFAULT provider for FlutterForge AI.
 *
 * OpenRouter is a multi-vendor gateway: one API key gives access to models
 * from Google, Anthropic, Meta, Mistral, Qwen, and many more — including a
 * rich catalog of FREE models (pricing.prompt === "0" && pricing.completion === "0").
 *
 * This is the only fully-implemented external provider in Phase 2.
 *
 * API reference: https://openrouter.ai/docs
 *   GET  /api/v1/models            (public, no auth)
 *   POST /api/v1/chat/completions  (auth: Bearer <key>)
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
import type { TokenUsage } from "@/features/ai/tokens/types";
import { AIError, aiErrors, errorFromStatus } from "@/features/ai/errors";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const APP_TITLE = "FlutterForge AI";
const APP_REFERER = "https://flutterforge.ai";

/** Raw OpenRouter model object (subset of fields we use). */
interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  architecture?: {
    modality?: string;
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    image?: string;
    request?: string;
    internal_reasoning?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
  supported_parameters?: string[];
}

/** Map an OpenRouter model to our universal ModelDescriptor. */
function mapModel(m: OpenRouterModel): ModelDescriptor {
  const promptCost = parseFloat(m.pricing?.prompt ?? "0") || 0;
  const completionCost = parseFloat(m.pricing?.completion ?? "0") || 0;
  const isFree = promptCost === 0 && completionCost === 0;
  // OpenRouter prices are per-token; convert to per-1M.
  const inputCostPer1M = promptCost * 1_000_000;
  const outputCostPer1M = completionCost * 1_000_000;
  const inputMods = m.architecture?.input_modalities ?? [];
  const outputMods = m.architecture?.output_modalities ?? [];
  const params = m.supported_parameters ?? [];
  const hasReasoning = params.includes("reasoning") || parseFloat(m.pricing?.internal_reasoning ?? "0") > 0;

  return {
    id: m.id,
    provider: "openrouter",
    name: m.name || m.id,
    contextLength: m.context_length ?? m.top_provider?.context_length ?? 4096,
    inputCostPer1M,
    outputCostPer1M,
    isFree,
    capabilities: {
      vision: inputMods.includes("image"),
      toolCalling: params.includes("tools") || params.includes("tool_choice"),
      json: params.includes("json_schema") || params.includes("response_format"),
      streaming: params.includes("stream"),
      reasoning: hasReasoning,
      image: outputMods.includes("image"),
      audio: inputMods.includes("audio") || outputMods.includes("audio"),
      embedding: false,
      functionCalling: params.includes("tools") || params.includes("tool_choice"),
    },
    maxOutputTokens: m.top_provider?.max_completion_tokens,
    description: m.description,
    raw: m,
  };
}

/** In-flight request tracker for cancellation. */
const activeRequests = new Map<string, AbortController>();

export const openRouterMeta: ProviderMeta = {
  id: "openrouter",
  name: "OpenRouter",
  description:
    "Multi-vendor gateway with hundreds of models including a rich free tier. Default provider for FlutterForge AI.",
  requiresApiKey: true,
  isBuiltIn: false,
  baseUrl: OPENROUTER_BASE,
  keyUrl: "https://openrouter.ai/keys",
  implemented: true,
  icon: "🌐",
};

/**
 * OpenRouterProvider — the working default provider.
 *
 * Implements: initialize, chat, stream, models, health, cancel.
 */
export class OpenRouterProvider implements AIProvider {
  readonly meta = openRouterMeta;
  config: ProviderConfig | null = null;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = { timeoutMs: 60_000, ...config };
  }

  private get headers(): Record<string, string> {
    const key = this.config?.apiKey;
    if (!key) throw aiErrors.missingCredentials("openrouter");
    return {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": APP_REFERER,
      "X-Title": APP_TITLE,
      ...(this.config?.headers ?? {}),
    };
  }

  private get baseUrl(): string {
    return this.config?.baseUrl || OPENROUTER_BASE;
  }

  /** GET /models — public endpoint, no auth required. */
  async models(): Promise<ModelDescriptor[]> {
    const res = await fetch(`${this.baseUrl}/models`, {
      headers: { "Content-Type": "application/json" },
      signal: this.timeoutSignal(),
    }).catch((e: unknown) => {
      throw e instanceof AIError ? e : aiErrors.network({ provider: "openrouter", details: String(e) });
    });

    if (!res.ok) throw errorFromStatus(res.status, "openrouter", await res.text());

    const json = (await res.json()) as { data: OpenRouterModel[] };
    return (json.data ?? []).map(mapModel);
  }

  /** POST /chat/completions (non-streaming). */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const body = this.buildBody(request, false);
    const res = await this.postChat(body, request.id);
    const json = (await res.json()) as OpenRouterChatResponse;
    const choice = json.choices?.[0];
    return {
      id: json.id ?? request.id,
      requestId: request.id,
      model: json.model ?? request.model,
      provider: "openrouter",
      content: choice?.message?.content ?? "",
      toolCalls: choice?.message?.tool_calls,
      finishReason: choice?.finish_reason,
      usage: json.usage
        ? {
            inputTokens: json.usage.prompt_tokens ?? 0,
            outputTokens: json.usage.completion_tokens ?? 0,
            totalTokens: json.usage.total_tokens ?? 0,
          }
        : undefined,
    };
  }

  /** POST /chat/completions (streaming) — yields ChatChunk deltas. */
  async *stream(request: ChatRequest): AsyncIterable<ChatChunk> {
    const body = this.buildBody(request, true);
    const controller = new AbortController();
    activeRequests.set(request.id, controller);

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (e: unknown) {
      activeRequests.delete(request.id);
      if (e instanceof AIError) throw e;
      throw aiErrors.network({ provider: "openrouter", requestId: request.id, details: String(e) });
    }

    if (!res.ok) {
      activeRequests.delete(request.id);
      throw errorFromStatus(res.status, "openrouter", await res.text());
    }

    if (!res.body) {
      activeRequests.delete(request.id);
      throw aiErrors.streamingInterrupted({ provider: "openrouter", requestId: request.id });
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (data === "[DONE]") {
            yield { type: "done", requestId: request.id, finishReason: "stop" };
            return;
          }
          try {
            const chunk = JSON.parse(data) as OpenRouterStreamChunk;
            const delta = chunk.choices?.[0]?.delta;
            if (delta?.content) {
              yield { type: "delta", content: delta.content, requestId: request.id };
            }
            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                yield {
                  type: "tool_call",
                  toolCall: {
                    id: tc.id ?? "",
                    type: "function",
                    function: { name: tc.function?.name ?? "", arguments: tc.function?.arguments ?? "" },
                  },
                  requestId: request.id,
                };
              }
            }
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
            const finish = chunk.choices?.[0]?.finish_reason;
            if (finish) {
              yield { type: "done", finishReason: finish, requestId: request.id };
              return;
            }
          } catch {
            // Skip malformed JSON lines — SSE can split mid-frame.
          }
        }
      }
    } catch (e: unknown) {
      if (e instanceof AIError) throw e;
      // AbortError happens on cancel — not an error.
      if (e instanceof Error && e.name === "AbortError") return;
      throw aiErrors.streamingInterrupted({ provider: "openrouter", requestId: request.id, details: String(e) });
    } finally {
      activeRequests.delete(request.id);
    }
  }

  async health(): Promise<HealthStatus> {
    const checkedAt = new Date().toISOString();
    if (!this.config?.apiKey) {
      return { provider: "openrouter", status: "unconfigured", message: "No API key set", checkedAt };
    }
    const start = Date.now();
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: { "Content-Type": "application/json" },
        signal: this.timeoutSignal(10_000),
      });
      const latencyMs = Date.now() - start;
      if (res.ok) return { provider: "openrouter", status: "healthy", latencyMs, checkedAt };
      if (res.status === 401 || res.status === 403)
        return { provider: "openrouter", status: "down", message: "Invalid API key", checkedAt };
      return { provider: "openrouter", status: "degraded", latencyMs, message: `HTTP ${res.status}`, checkedAt };
    } catch {
      return { provider: "openrouter", status: "down", message: "Network error", checkedAt };
    }
  }

  async cancel(requestId: string): Promise<void> {
    const controller = activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      activeRequests.delete(requestId);
    }
  }

  // --- internals ---

  private timeoutSignal(ms?: number): AbortSignal {
    const timeout = ms ?? this.config?.timeoutMs ?? 60_000;
    return AbortSignal.timeout(timeout);
  }

  private buildBody(request: ChatRequest, stream: boolean): Record<string, unknown> {
    const messages = this.assembleMessages(request);
    const body: Record<string, unknown> = {
      model: request.model,
      messages,
      stream,
    };
    if (request.temperature !== undefined) body.temperature = request.temperature;
    if (request.topP !== undefined) body.top_p = request.topP;
    if (request.maxTokens !== undefined) body.max_tokens = request.maxTokens;
    if (request.presencePenalty !== undefined) body.presence_penalty = request.presencePenalty;
    if (request.frequencyPenalty !== undefined) body.frequency_penalty = request.frequencyPenalty;
    if (request.stop) body.stop = request.stop;
    if (request.tools) body.tools = request.tools;
    if (request.jsonSchema) body.response_format = { type: "json_schema", json_schema: request.jsonSchema };
    if (request.reasoningEffort) body.reasoning = { effort: request.reasoningEffort };
    if (stream) body.stream_options = { include_usage: true };
    return body;
  }

  /** Merge system/developer prompts into the message array. */
  private assembleMessages(request: ChatRequest): Array<Record<string, unknown>> {
    const out: Array<Record<string, unknown>> = [];
    if (request.systemPrompt) out.push({ role: "system", content: request.systemPrompt });
    if (request.developerPrompt) out.push({ role: "developer", content: request.developerPrompt });
    for (const m of request.messages) {
      out.push(this.toOpenRouterMessage(m));
    }
    return out;
  }

  private toOpenRouterMessage(m: ChatMessage): Record<string, unknown> {
    const msg: Record<string, unknown> = { role: m.role, content: m.content };
    if (m.name) msg.name = m.name;
    if (m.toolCallId) msg.tool_call_id = m.toolCallId;
    if (m.toolCalls) msg.tool_calls = m.toolCalls;
    return msg;
  }

  private async postChat(body: Record<string, unknown>, requestId: string): Promise<Response> {
    const controller = new AbortController();
    activeRequests.set(requestId, controller);
    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!res.ok) throw errorFromStatus(res.status, "openrouter", await res.text());
      return res;
    } catch (e: unknown) {
      if (e instanceof AIError) throw e;
      if (e instanceof Error && e.name === "AbortError") throw e;
      throw aiErrors.network({ provider: "openrouter", requestId, details: String(e) });
    } finally {
      activeRequests.delete(requestId);
    }
  }
}

// --- OpenRouter response shapes (subset) ---

interface OpenRouterChatResponse {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: { content?: string; tool_calls?: ChatChunk["toolCall"][] };
    finish_reason?: ChatResponse["finishReason"];
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

interface OpenRouterStreamChunk {
  id?: string;
  choices?: Array<{
    delta?: {
      content?: string;
      tool_calls?: Array<{
        id?: string;
        function?: { name?: string; arguments?: string };
      }>;
    };
    finish_reason?: ChatResponse["finishReason"];
  }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}
