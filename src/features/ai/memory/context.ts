/**
 * @module features/ai/memory/context
 *
 * Context memory — decides which messages fit in the model's context window
 * and assembles the final message array for a chat request. Works with the
 * token estimator and the context manager.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { ConversationSession, MemoryOptions } from "./types";
import { estimateMessageTokens } from "@/features/ai/tokens/counter";

/** Result of fitting a conversation into a context window. */
export interface ContextFitResult {
  /** Messages that fit (oldest → newest). */
  messages: ChatMessage[];
  /** Estimated token count of the fitted messages. */
  estimatedTokens: number;
  /** Number of messages that were trimmed from the front. */
  trimmedCount: number;
  /** Whether all messages fit without trimming. */
  fits: boolean;
}

/** Default memory options. */
export const DEFAULT_MEMORY_OPTIONS: Required<MemoryOptions> = {
  maxMessages: 50,
  includePinned: true,
  includeSummaries: true,
};

/**
 * Fit a conversation's messages into a context window.
 * Strategy: always keep pinned messages + the most recent N messages.
 */
export function fitToContext(
  session: ConversationSession,
  contextLength: number,
  options: MemoryOptions = {}
): ContextFitResult {
  const opts = { ...DEFAULT_MEMORY_OPTIONS, ...options };
  const { messages } = session;

  // Separate pinned from unpinned.
  const pinned = opts.includePinned ? messages.filter((m) => m.pinned) : [];
  const unpinned = messages.filter((m) => !m.pinned);

  // Keep the most recent maxMessages unpinned messages.
  const recent = unpinned.slice(-opts.maxMessages);

  // Merge and preserve chronological order.
  const candidate = [...pinned, ...recent].sort((a, b) =>
    (a.createdAt ?? "").localeCompare(b.createdAt ?? "")
  );

  // Trim from the front until we fit the context window.
  let fitted = candidate;
  let estimatedTokens = 0;
  let trimmedCount = 0;

  // Compute tokens iteratively and trim if needed.
  const computeTokens = (msgs: ChatMessage[]) =>
    msgs.reduce((sum, m) => sum + estimateMessageTokens(m.role, m.content), 0);

  estimatedTokens = computeTokens(fitted);
  while (estimatedTokens > contextLength * 0.8 && fitted.length > 1) {
    // Don't trim pinned messages — only the oldest unpinned.
    const firstUnpinnedIdx = fitted.findIndex((m) => !m.pinned);
    if (firstUnpinnedIdx === -1) break;
    fitted = fitted.filter((_, i) => i !== firstUnpinnedIdx);
    trimmedCount++;
    estimatedTokens = computeTokens(fitted);
  }

  return {
    messages: fitted,
    estimatedTokens,
    trimmedCount,
    fits: trimmedCount === 0,
  };
}
