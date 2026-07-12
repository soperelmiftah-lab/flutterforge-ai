/**
 * @module features/ai/context/manager
 *
 * Context manager — the high-level orchestrator that assembles the final
 * message array for a chat request. It combines:
 *   1. Pinned messages (always included)
 *   2. Summaries of older messages (if available)
 *   3. Recent messages (fitted to the context window)
 *
 * It also reports token estimates so the UI can show context usage.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { ConversationSession } from "@/features/ai/memory/types";
import { fitToContext } from "@/features/ai/memory/context";
import { onlyPinned } from "@/features/ai/memory/pinned";
import { estimateConversationTokens } from "@/features/ai/tokens/counter";

export interface ContextManagerResult {
  /** Final message array to send to the provider. */
  messages: ChatMessage[];
  /** Estimated token count of the messages. */
  estimatedTokens: number;
  /** Model's context window. */
  contextLength: number;
  /** Usage percentage (0-100). */
  usagePercent: number;
  /** Number of messages trimmed from the front. */
  trimmedCount: number;
}

/**
 * Assemble the context for a chat request.
 * @param session The conversation session.
 * @param contextLength The model's context window in tokens.
 */
export function assembleContext(
  session: ConversationSession,
  contextLength: number
): ContextManagerResult {
  const fit = fitToContext(session, contextLength);
  const estimatedTokens = estimateConversationTokens(
    fit.messages.map((m) => ({ role: m.role, content: m.content }))
  );
  const usagePercent = Math.min(100, (estimatedTokens / contextLength) * 100);

  return {
    messages: fit.messages,
    estimatedTokens,
    contextLength,
    usagePercent,
    trimmedCount: fit.trimmedCount,
  };
}

/** Get just the pinned messages from a session. */
export function getPinnedContext(session: ConversationSession): ChatMessage[] {
  return onlyPinned(session.messages);
}
