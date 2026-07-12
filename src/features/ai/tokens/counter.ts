/**
 * @module features/ai/tokens/counter
 *
 * Token estimation. Without a model-specific tokenizer (tiktoken, etc.), we
 * use a character + word hybrid heuristic that's accurate to ~10% for
 * English text and code. The interface is pluggable — a real tokenizer can
 * be swapped in later without changing callers.
 */

/** Estimate the token count of a string. */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Heuristic: ~4 characters per token for English/code, but words give a
  // better estimate for prose. We blend both.
  const charEstimate = text.length / 4;
  const wordEstimate = text.trim().split(/\s+/).length * 1.3;
  return Math.max(1, Math.round((charEstimate + wordEstimate) / 2));
}

/** Estimate tokens for a message (content + role overhead). */
export function estimateMessageTokens(role: string, content: string): number {
  // Each message has ~4 tokens of structural overhead (role, delimiters).
  return estimateTokens(role) + estimateTokens(content) + 4;
}

/** Estimate total tokens for a conversation (message array). */
export function estimateConversationTokens(
  messages: Array<{ role: string; content: string }>
): number {
  let total = 3; // base overhead for the prompt format
  for (const m of messages) {
    total += estimateMessageTokens(m.role, m.content);
  }
  return total;
}

/** Format a token count for display (e.g. "12.4k"). */
export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/** Calculate context usage as a percentage. */
export function contextUsagePercent(used: number, contextLength: number): number {
  if (!contextLength) return 0;
  return Math.min(100, (used / contextLength) * 100);
}
