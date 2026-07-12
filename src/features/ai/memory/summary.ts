/**
 * @module features/ai/memory/summary
 *
 * Conversation summaries. When a conversation exceeds the context window,
 * older messages are summarised into a compact text block that's prepended
 * to the context. This preserves long-term context without exceeding token
 * limits.
 *
 * Phase 2: the summarisation CALL is a stub (would use the LLM to summarise).
 * The data structures and integration points are real so Phase 3+ can fill
 * in the actual summarisation logic.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { ConversationSummary } from "./types";
import { estimateTokens } from "@/features/ai/tokens/counter";
import { uid } from "@/lib/utils";

/**
 * Summarise a list of messages into a compact text block.
 * NOT IMPLEMENTED in Phase 2 — would call the LLM to produce a summary.
 */
export async function summariseMessages(
  sessionId: string,
  messages: ChatMessage[]
): Promise<ConversationSummary> {
  // Stub: in Phase 3+, this will call the chat engine with a summarisation prompt.
  // For now, we produce a structural summary (message count + roles).
  const userMessages = messages.filter((m) => m.role === "user").length;
  const assistantMessages = messages.filter((m) => m.role === "assistant").length;
  const content = `[Summary of ${messages.length} earlier messages (${userMessages} user, ${assistantMessages} assistant). Full summarisation arrives in Phase 3.]`;

  return {
    id: uid("sum"),
    sessionId,
    content,
    summarisedUpTo: messages.length,
    tokenEstimate: estimateTokens(content),
    createdAt: new Date().toISOString(),
  };
}

/** Build the system-message text from a summary (prepended to context). */
export function summaryToText(summary: ConversationSummary): string {
  return `Earlier conversation summary:\n${summary.content}`;
}
