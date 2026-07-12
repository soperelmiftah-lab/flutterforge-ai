/**
 * @module features/ai/provider/placeholders
 *
 * Placeholder providers for Phase 2. Each implements the AIProvider interface
 * but throws PROVIDER_NOT_IMPLEMENTED for chat/stream. `models()` and
 * `health()` return sensible defaults so the UI can render them.
 *
 * These are scaffolds for future phases — swap the throwing methods for real
 * implementations without touching callers.
 */

import type {
  AIProvider,
  ProviderConfig,
  ProviderMeta,
  HealthStatus,
} from "@/features/ai/provider/types";
import type { ModelDescriptor } from "@/features/ai/models/types";
import type { ChatRequest, ChatResponse, ChatChunk } from "@/features/ai/chat/types";
import { aiErrors } from "@/features/ai/errors";

/** Base class for not-yet-implemented providers. */
abstract class PlaceholderProvider implements AIProvider {
  abstract readonly meta: ProviderMeta;
  config: ProviderConfig | null = null;

  async initialize(config: ProviderConfig): Promise<void> {
    this.config = config;
  }

  async models(): Promise<ModelDescriptor[]> {
    return [];
  }

  async chat(_request: ChatRequest): Promise<ChatResponse> {
    throw aiErrors.notImplemented(this.meta.id);
  }

  async *_stream(_request: ChatRequest): AsyncIterable<ChatChunk> {
    throw aiErrors.notImplemented(this.meta.id);
  }

  stream = this._stream.bind(this);

  async health(): Promise<HealthStatus> {
    return {
      provider: this.meta.id,
      status: "unconfigured",
      message: "Not implemented in Phase 2",
      checkedAt: new Date().toISOString(),
    };
  }

  async cancel(_requestId: string): Promise<void> {
    /* no-op */
  }
}

// --- OpenAI ---

export const openaiMeta: ProviderMeta = {
  id: "openai",
  name: "OpenAI",
  description: "GPT-4o, GPT-4.1, o-series and embedding models. Requires an OpenAI API key.",
  requiresApiKey: true,
  isBuiltIn: false,
  baseUrl: "https://api.openai.com/v1",
  keyUrl: "https://platform.openai.com/api-keys",
  implemented: false,
  icon: "🟢",
};

export class OpenAIProvider extends PlaceholderProvider {
  readonly meta = openaiMeta;
}

// --- Anthropic Claude ---

export const anthropicMeta: ProviderMeta = {
  id: "anthropic",
  name: "Anthropic Claude",
  description: "Claude 3.5 / 3.7 / Opus / Sonnet / Haiku. Requires an Anthropic API key.",
  requiresApiKey: true,
  isBuiltIn: false,
  baseUrl: "https://api.anthropic.com/v1",
  keyUrl: "https://console.anthropic.com/settings/keys",
  implemented: false,
  icon: "🟠",
};

export class AnthropicProvider extends PlaceholderProvider {
  readonly meta = anthropicMeta;
}

// --- Google Gemini ---

export const geminiMeta: ProviderMeta = {
  id: "gemini",
  name: "Google Gemini",
  description: "Gemini 2.0 Flash, Pro, and Flash-Lite. Requires a Google AI Studio API key.",
  requiresApiKey: true,
  isBuiltIn: false,
  baseUrl: "https://generativelanguage.googleapis.com/v1beta",
  keyUrl: "https://aistudio.google.com/apikey",
  implemented: false,
  icon: "🔵",
};

export class GeminiProvider extends PlaceholderProvider {
  readonly meta = geminiMeta;
}

// --- Ollama (local) ---

export const ollamaMeta: ProviderMeta = {
  id: "ollama",
  name: "Ollama (Local)",
  description: "Run open-source models locally (Llama, Qwen, Mistral). No API key — runs on localhost.",
  requiresApiKey: false,
  isBuiltIn: false,
  baseUrl: "http://localhost:11434/v1",
  implemented: false,
  icon: "🦙",
};

export class OllamaProvider extends PlaceholderProvider {
  readonly meta = ollamaMeta;
}

// --- LM Studio (local) ---

export const lmstudioMeta: ProviderMeta = {
  id: "lmstudio",
  name: "LM Studio (Local)",
  description: "Run GGUF models locally via LM Studio's OpenAI-compatible server.",
  requiresApiKey: false,
  isBuiltIn: false,
  baseUrl: "http://localhost:1234/v1",
  implemented: false,
  icon: "🎛️",
};

export class LMStudioProvider extends PlaceholderProvider {
  readonly meta = lmstudioMeta;
}

// --- OpenAI-Compatible (generic) ---

export const openaiCompatibleMeta: ProviderMeta = {
  id: "openai-compatible",
  name: "OpenAI-Compatible",
  description: "Any endpoint that implements the OpenAI Chat Completions API (vLLM, Together, Groq, etc.).",
  requiresApiKey: true,
  isBuiltIn: false,
  implemented: false,
  icon: "🔌",
};

export class OpenAICompatibleProvider extends PlaceholderProvider {
  readonly meta = openaiCompatibleMeta;
}

// --- Custom Endpoint ---

export const customMeta: ProviderMeta = {
  id: "custom",
  name: "Custom Endpoint",
  description: "Bring your own endpoint with fully custom headers, auth, and request format.",
  requiresApiKey: true,
  isBuiltIn: false,
  implemented: false,
  icon: "⚙️",
};

export class CustomProvider extends PlaceholderProvider {
  readonly meta = customMeta;
}
