/**
 * @module features/ai/errors
 *
 * Unified error hierarchy for the AI Core. Every failure path produces a
 * typed AIError so callers can branch on `code` instead of parsing messages.
 * Used by providers, the chat engine, streaming, and the API layer.
 */

export type AIErrorCode =
  | "NETWORK_ERROR"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMIT"
  | "TIMEOUT"
  | "INVALID_API_KEY"
  | "UNKNOWN_MODEL"
  | "STREAMING_INTERRUPTED"
  | "MISSING_CREDENTIALS"
  | "INVALID_REQUEST"
  | "PROVIDER_NOT_IMPLEMENTED"
  | "CONTEXT_OVERFLOW"
  | "UNKNOWN";

export interface AIErrorContext {
  provider?: string;
  model?: string;
  requestId?: string;
  statusCode?: number;
  retryable?: boolean;
  details?: unknown;
}

export class AIError extends Error {
  readonly code: AIErrorCode;
  readonly context: AIErrorContext;

  constructor(code: AIErrorCode, message: string, context: AIErrorContext = {}) {
    super(message);
    this.name = "AIError";
    this.code = code;
    this.context = { retryable: false, ...context };
    Object.setPrototypeOf(this, AIError.prototype);
  }

  /** Whether retrying the same request could succeed. */
  get retryable(): boolean {
    if (this.context.retryable !== undefined) return this.context.retryable;
    return (
      this.code === "NETWORK_ERROR" ||
      this.code === "TIMEOUT" ||
      this.code === "PROVIDER_UNAVAILABLE" ||
      this.code === "RATE_LIMIT" ||
      this.code === "STREAMING_INTERRUPTED"
    );
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
    };
  }
}

/** Convenience factory functions for common error cases. */
export const aiErrors = {
  network: (ctx: AIErrorContext = {}) =>
    new AIError("NETWORK_ERROR", "A network error occurred while contacting the AI provider.", { ...ctx, retryable: true }),
  providerUnavailable: (provider: string, ctx: AIErrorContext = {}) =>
    new AIError("PROVIDER_UNAVAILABLE", `Provider "${provider}" is currently unavailable.`, { ...ctx, provider, retryable: true }),
  rateLimit: (ctx: AIErrorContext = {}) =>
    new AIError("RATE_LIMIT", "Rate limit exceeded. Please slow down or upgrade your plan.", { ...ctx, retryable: true }),
  timeout: (ctx: AIErrorContext = {}) =>
    new AIError("TIMEOUT", "The request timed out before the provider responded.", { ...ctx, retryable: true }),
  invalidApiKey: (provider: string, ctx: AIErrorContext = {}) =>
    new AIError("INVALID_API_KEY", `The API key for "${provider}" is invalid or missing.`, { ...ctx, provider, retryable: false }),
  unknownModel: (model: string, ctx: AIErrorContext = {}) =>
    new AIError("UNKNOWN_MODEL", `Model "${model}" is not available on this provider.`, { ...ctx, model, retryable: false }),
  streamingInterrupted: (ctx: AIErrorContext = {}) =>
    new AIError("STREAMING_INTERRUPTED", "The streaming connection was interrupted.", { ...ctx, retryable: true }),
  missingCredentials: (provider: string, ctx: AIErrorContext = {}) =>
    new AIError("MISSING_CREDENTIALS", `No API key configured for "${provider}". Add one in AI Settings.`, { ...ctx, provider, retryable: false }),
  invalidRequest: (message: string, ctx: AIErrorContext = {}) =>
    new AIError("INVALID_REQUEST", message, { ...ctx, retryable: false }),
  notImplemented: (provider: string, ctx: AIErrorContext = {}) =>
    new AIError("PROVIDER_NOT_IMPLEMENTED", `Provider "${provider}" is not yet implemented. Configure it in a future phase.`, { ...ctx, provider, retryable: false }),
  contextOverflow: (ctx: AIErrorContext = {}) =>
    new AIError("CONTEXT_OVERFLOW", "The conversation exceeds the model's context window.", { ...ctx, retryable: false }),
  unknown: (message: string, ctx: AIErrorContext = {}) =>
    new AIError("UNKNOWN", message, { ...ctx, retryable: false }),
};

/** Map an HTTP status code to the most likely AIError. */
export function errorFromStatus(status: number, provider: string, body?: string): AIError {
  const ctx: AIErrorContext = { provider, statusCode: status, details: body };
  if (status === 401 || status === 403) return aiErrors.invalidApiKey(provider, ctx);
  if (status === 404) return aiErrors.unknownModel(provider, ctx);
  if (status === 429) return aiErrors.rateLimit(ctx);
  if (status >= 500) return aiErrors.providerUnavailable(provider, ctx);
  return aiErrors.invalidRequest(`Provider returned HTTP ${status}.`, ctx);
}
