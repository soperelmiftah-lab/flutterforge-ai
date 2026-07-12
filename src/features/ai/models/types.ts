/**
 * @module features/ai/models/types
 *
 * Model descriptor — the universal representation of an AI model. Every
 * provider maps its native model format into this shape so the model
 * registry, UI, and chat engine all speak the same language.
 */

import type { ProviderId } from "@/features/ai/provider/types";

/** Capability flags. A model either supports a capability or it doesn't. */
export interface ModelCapabilities {
  /** Can accept image inputs (multimodal vision). */
  vision: boolean;
  /** Supports tool/function calling. */
  toolCalling: boolean;
  /** Can return valid JSON (json_schema / response_format). */
  json: boolean;
  /** Supports token streaming. */
  streaming: boolean;
  /** Supports extended reasoning / chain-of-thought. */
  reasoning: boolean;
  /** Can generate images. */
  image: boolean;
  /** Can process or generate audio. */
  audio: boolean;
  /** Supports text embeddings. */
  embedding: boolean;
  /** Alias for toolCalling (some APIs name it differently). */
  functionCalling: boolean;
}

/**
 * A model's full descriptor. Used by the registry, model selector UI,
 * context manager (contextLength), and token estimator.
 */
export interface ModelDescriptor {
  /** Fully-qualified model id (e.g. "google/gemini-2.0-flash-exp:free"). */
  id: string;
  /** Which provider hosts this model. */
  provider: ProviderId;
  /** Human-friendly display name. */
  name: string;
  /** Maximum input + output context window in tokens. */
  contextLength: number;
  /** Cost per 1M input tokens in USD (0 for free models). */
  inputCostPer1M: number;
  /** Cost per 1M output tokens in USD (0 for free models). */
  outputCostPer1M: number;
  /** True when both input and output are free. */
  isFree: boolean;
  /** Capability matrix. */
  capabilities: ModelCapabilities;
  /** Maximum output tokens per request, if known. */
  maxOutputTokens?: number;
  /** Provider-supplied description. */
  description?: string;
  /** The raw provider payload, for advanced users. */
  raw?: unknown;
}

/** Filter options for the model registry / selector UI. */
export interface ModelFilter {
  /** When true, only free models are returned. */
  freeOnly: boolean;
  /** Optional provider filter. */
  provider?: ProviderId;
  /** Optional capability requirements. */
  requires?: Partial<ModelCapabilities>;
  /** Optional search query (matches id or name). */
  query?: string;
}

/** Sort key for model listings. */
export type ModelSortKey = "popularity" | "name" | "contextLength" | "cost";
