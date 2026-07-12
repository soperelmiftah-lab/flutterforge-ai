/**
 * @module features/ai/tokens/types
 *
 * Token usage types. Shared by the token engine, chat engine, memory system,
 * and the token counter UI.
 */

/** Token usage for a single request or cumulative session. */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  /** Context window size of the model used (for % calculations). */
  contextLength?: number;
}

/** A token usage record for persistence/tracking. */
export interface TokenRecord {
  id: string;
  sessionId?: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  timestamp: string;
}
