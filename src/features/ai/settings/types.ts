/**
 * @module features/ai/settings/types
 *
 * AI settings types. These mirror the Zustand ai-store and are persisted
 * to localStorage on the client. The API layer also accepts/returns this
 * shape for server-side persistence in future phases.
 */

import type { ProviderId } from "@/features/ai/provider/types";

/** Reasoning effort level (for models that support it). */
export type ReasoningEffort = "low" | "medium" | "high" | "none";

/** Full AI settings. */
export interface AISettings {
  /** Active provider. */
  provider: ProviderId;
  /** Active model id. */
  model: string;
  /** Generation parameters. */
  temperature: number;
  topP: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
  reasoningEffort: ReasoningEffort;
  /** Whether to stream responses. */
  streaming: boolean;
  /** Preferred context length (for display/truncation). */
  contextLength: number;
  /** Whether to show paid models in the selector. */
  showPaidModels: boolean;
  /** Custom system prompt instructions. */
  customInstructions: string;
  /** Beginner mode (adjusts prompt tone). */
  beginnerMode: boolean;
}

/** Default AI settings. OpenRouter is the default provider per spec. */
export const defaultAISettings: AISettings = {
  provider: "openrouter",
  model: "", // resolved dynamically from free models
  temperature: 0.7,
  topP: 1.0,
  maxTokens: 4096,
  presencePenalty: 0,
  frequencyPenalty: 0,
  reasoningEffort: "medium",
  streaming: true,
  contextLength: 8192,
  showPaidModels: false,
  customInstructions: "",
  beginnerMode: false,
};

/** Validation constraints for AI settings. */
export const aiSettingsConstraints = {
  temperature: { min: 0, max: 2, step: 0.1 },
  topP: { min: 0, max: 1, step: 0.05 },
  maxTokens: { min: 256, max: 32768, step: 256 },
  presencePenalty: { min: -2, max: 2, step: 0.1 },
  frequencyPenalty: { min: -2, max: 2, step: 0.1 },
  contextLength: { min: 2048, max: 2_000_000, step: 1024 },
} as const;
