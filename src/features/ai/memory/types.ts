/**
 * @module features/ai/memory/types
 *
 * Memory system types. The memory layer manages conversation history, pinned
 * messages, summaries, and context-window fitting. It sits between the UI
 * (chat store) and the chat engine.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { TokenUsage } from "@/features/ai/tokens/types";

/** A conversation session. */
export interface ConversationSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  model: string;
  provider: string;
}

/** A summary of older conversation turns (to save context). */
export interface ConversationSummary {
  id: string;
  sessionId: string;
  content: string;
  summarisedUpTo: number; // message index
  tokenEstimate: number;
  createdAt: string;
}

/** Memory options. */
export interface MemoryOptions {
  /** Maximum messages to keep before summarising older ones. */
  maxMessages?: number;
  /** Whether to include pinned messages in the context. */
  includePinned?: boolean;
  /** Whether to include summaries of older messages. */
  includeSummaries?: boolean;
}
