/**
 * @module features/ai/memory/conversation
 *
 * Conversation memory — manages a single conversation's message history,
 * including add, edit, delete, and pin operations. This is the in-memory
 * store; the Zustand chat-store wraps it for React reactivity.
 */

import type { ChatMessage } from "@/features/ai/chat/types";
import type { ConversationSession } from "./types";
import { uid } from "@/lib/utils";

/** Create a new conversation session. */
export function createSession(model: string, provider: string, title = "New chat"): ConversationSession {
  const now = new Date().toISOString();
  return {
    id: uid("sess"),
    title,
    messages: [],
    createdAt: now,
    updatedAt: now,
    model,
    provider,
  };
}

/** Add a message to a session. Returns a new session (immutable). */
export function addMessage(session: ConversationSession, message: ChatMessage): ConversationSession {
  return {
    ...session,
    messages: [...session.messages, message],
    updatedAt: new Date().toISOString(),
  };
}

/** Update a message by id. */
export function updateMessage(
  session: ConversationSession,
  messageId: string,
  updates: Partial<ChatMessage>
): ConversationSession {
  return {
    ...session,
    messages: session.messages.map((m) => (m.id === messageId ? { ...m, ...updates } : m)),
    updatedAt: new Date().toISOString(),
  };
}

/** Delete a message by id. */
export function deleteMessage(session: ConversationSession, messageId: string): ConversationSession {
  return {
    ...session,
    messages: session.messages.filter((m) => m.id !== messageId),
    updatedAt: new Date().toISOString(),
  };
}

/** Pin/unpin a message. */
export function togglePin(session: ConversationSession, messageId: string): ConversationSession {
  return {
    ...session,
    messages: session.messages.map((m) =>
      m.id === messageId ? { ...m, pinned: !m.pinned } : m
    ),
  };
}

/** Get all pinned messages. */
export function getPinned(session: ConversationSession): ChatMessage[] {
  return session.messages.filter((m) => m.pinned);
}

/** Derive a title from the first user message. */
export function deriveTitle(session: ConversationSession): string {
  const firstUser = session.messages.find((m) => m.role === "user");
  if (!firstUser) return session.title;
  const title = firstUser.content.slice(0, 60).trim();
  return title.length < firstUser.content.length ? `${title}…` : title;
}
