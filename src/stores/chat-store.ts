"use client";

import { create } from "zustand";
import type { ChatMessage } from "@/features/ai/chat/types";
import type { TokenUsage } from "@/features/ai/tokens/types";
import { uid } from "@/lib/utils";
import { consumeSSEStream, type SSEEvent } from "@/features/ai/stream/sse";
import { createAccumulator, applyChunk } from "@/features/ai/stream/parser";
import type { ChatChunk } from "@/features/ai/chat/types";
import { useAIStore } from "./ai-store";

/**
 * Chat store — manages the active conversation and the streaming chat flow.
 * Handles sending messages, consuming SSE streams, and accumulating the
 * assistant's response. This is the bridge between the UI and the AI Core.
 */
interface ChatStoreState {
  messages: ChatMessage[];
  streaming: boolean;
  error: string | null;
  lastUsage: TokenUsage | null;
  abort: (() => void) | null;

  send: (content: string) => Promise<void>;
  stop: () => void;
  clear: () => void;
  removeMessage: (id: string) => void;
  togglePin: (id: string) => void;
}

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  streaming: false,
  error: null,
  lastUsage: null,
  abort: null,

  send: async (content) => {
    const ai = useAIStore.getState();
    const userMsg: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const assistantMsg: ChatMessage = {
      id: uid("msg"),
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };

    set((s) => ({
      messages: [...s.messages, userMsg, assistantMsg],
      streaming: true,
      error: null,
    }));

    // Build the request — send only prior messages (not the empty assistant placeholder).
    const history = get().messages.filter((m) => m.id !== assistantMsg.id);

    const controller = new AbortController();
    set({ abort: () => controller.abort() });

    try {
      const res = await fetch("/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: ai.provider,
          model: ai.model,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
          temperature: ai.temperature,
          topP: ai.topP,
          maxTokens: ai.maxTokens,
          presencePenalty: ai.presencePenalty,
          frequencyPenalty: ai.frequencyPenalty,
          reasoningEffort: ai.reasoningEffort,
          stream: ai.streaming,
          customInstructions: ai.customInstructions,
          beginnerMode: ai.beginnerMode,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `HTTP ${res.status}`);
      }

      // Non-streaming response
      if (!ai.streaming) {
        const data = await res.json();
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: data.content ?? "" }
              : m
          ),
          lastUsage: data.usage ?? null,
          streaming: false,
        }));
        return;
      }

      // Streaming response — consume SSE
      const acc = createAccumulator();
      for await (const event of consumeSSEStream(res)) {
        if (event.type === "chunk") {
          const chunk = event.chunk as ChatChunk;
          applyChunk(acc, chunk);
          if (chunk.type === "delta" && chunk.content) {
            set((s) => ({
              messages: s.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: m.content + chunk.content }
                  : m
              ),
            }));
          }
          if (chunk.type === "usage" && chunk.usage) {
            set({ lastUsage: chunk.usage });
          }
        } else if (event.type === "error") {
          throw new Error(event.error.message);
        }
      }

      // If no content was streamed (empty response), show a fallback.
      if (!acc.content && !acc.error) {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "(No response received.)" }
              : m
          ),
        }));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Chat failed";
      if (msg.includes("aborted")) {
        // User cancelled — keep partial content.
      } else {
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: `⚠️ ${msg}` }
              : m
          ),
          error: msg,
        }));
      }
    } finally {
      set({ streaming: false, abort: null });
    }
  },

  stop: () => {
    const { abort } = get();
    if (abort) abort();
    set({ streaming: false, abort: null });
  },

  clear: () => set({ messages: [], error: null, lastUsage: null }),

  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

  togglePin: (id) =>
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === id ? { ...m, pinned: !m.pinned } : m
      ),
    })),
}));
