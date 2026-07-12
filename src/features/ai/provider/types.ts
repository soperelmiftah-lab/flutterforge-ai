/**
 * @module features/ai/provider/types
 *
 * The provider abstraction layer. Every AI provider implements the `AIProvider`
 * interface, so the chat engine, model registry, and API routes never name a
 * vendor directly. Swapping providers is a config change, not a code change.
 */

import type { ModelDescriptor } from "@/features/ai/models/types";
import type { ChatRequest, ChatResponse, ChatChunk } from "@/features/ai/chat/types";

/** All supported provider identifiers. */
export type ProviderId =
  | "forge" // built-in (z-ai SDK, no key required)
  | "openrouter" // default — multi-vendor gateway
  | "openai"
  | "anthropic"
  | "gemini"
  | "ollama"
  | "lmstudio"
  | "openai-compatible"
  | "custom";

/** Static metadata about a provider (independent of runtime config). */
export interface ProviderMeta {
  id: ProviderId;
  name: string;
  description: string;
  /** Whether an API key is required to use this provider. */
  requiresApiKey: boolean;
  /** Whether this provider works out-of-the-box without user credentials. */
  isBuiltIn: boolean;
  /** Default base URL for the provider's API. */
  baseUrl?: string;
  /** Where the user can obtain an API key. */
  keyUrl?: string;
  /** Whether this provider is implemented (true) or a placeholder (false). */
  implemented: boolean;
  /** Icon/emoji for display. */
  icon: string;
}

/** Runtime configuration for a provider instance. */
export interface ProviderConfig {
  provider: ProviderId;
  apiKey?: string;
  baseUrl?: string;
  /** Extra headers to send with every request. */
  headers?: Record<string, string>;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
}

/** Health check result. */
export interface HealthStatus {
  provider: ProviderId;
  status: "healthy" | "degraded" | "down" | "unconfigured";
  latencyMs?: number;
  message?: string;
  checkedAt: string;
}

/**
 * The universal provider contract. Every provider implements this.
 *
 * Lifecycle:
 *   1. initialize(config)  — store credentials/settings
 *   2. models()            — list available models
 *   3. chat(req)/stream(req) — execute a completion
 *   4. health()            — verify connectivity
 *   5. cancel(id)          — abort an in-flight request
 */
export interface AIProvider {
  readonly meta: ProviderMeta;
  /** Current config (set by initialize). */
  readonly config: ProviderConfig | null;

  /** Store credentials and settings. Safe to call multiple times. */
  initialize(config: ProviderConfig): Promise<void>;
  /** Non-streaming chat completion. */
  chat(request: ChatRequest): Promise<ChatResponse>;
  /** Streaming chat completion — yields deltas as they arrive. */
  stream(request: ChatRequest): AsyncIterable<ChatChunk>;
  /** List models available on this provider. */
  models(): Promise<ModelDescriptor[]>;
  /** Check connectivity and credential validity. */
  health(): Promise<HealthStatus>;
  /** Cancel an in-flight request by its id. */
  cancel(requestId: string): Promise<void>;
}

/** Registry entry pairing a provider meta with its factory. */
export interface ProviderRegistryEntry {
  meta: ProviderMeta;
  factory: () => AIProvider;
}

/** A credential record as seen by the client (key is masked). */
export interface CredentialView {
  provider: ProviderId;
  hasKey: boolean;
  maskedKey?: string;
  updatedAt?: string;
}

export type { ModelDescriptor, ChatRequest, ChatResponse, ChatChunk };
