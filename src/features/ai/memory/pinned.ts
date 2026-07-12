/**
 * @module features/ai/memory/pinned
 *
 * Pinned message management. Pinned messages are always included in the
 * context window, regardless of how old they are. Useful for keeping
 * project requirements, architecture decisions, or key code snippets
 * visible to the model throughout a long conversation.
 */

import type { ChatMessage } from "@/features/ai/chat/types";

/** Check if a message is pinned. */
export function isPinned(message: ChatMessage): boolean {
  return message.pinned === true;
}

/** Filter a list to only pinned messages. */
export function onlyPinned(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(isPinned);
}

/** Pin a message (returns a new message object). */
export function pin(message: ChatMessage): ChatMessage {
  return { ...message, pinned: true };
}

/** Unpin a message (returns a new message object). */
export function unpin(message: ChatMessage): ChatMessage {
  return { ...message, pinned: false };
}
