"use client";

import { create } from "zustand";
import type { TokenUsage, TokenRecord } from "@/features/ai/tokens/types";
import { estimateTokens, formatTokens } from "@/features/ai/tokens/counter";

/**
 * Token store — tracks cumulative token usage across a chat session for
 * display in the token counter UI. Fed by the chat store when usage
 * events arrive from the stream.
 */
interface TokenStoreState {
  session: TokenUsage;
  lastRequest: TokenUsage | null;
  records: TokenRecord[];
  contextLength: number;

  recordUsage: (usage: TokenUsage, model: string, provider: string) => void;
  setContextLength: (n: number) => void;
  estimateInput: (messages: Array<{ role: string; content: string }>) => number;
  reset: () => void;
  formatted: () => { input: string; output: string; total: string; usagePercent: number };
}

export const useTokenStore = create<TokenStoreState>((set, get) => ({
  session: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
  lastRequest: null,
  records: [],
  contextLength: 8192,

  recordUsage: (usage, model, provider) => {
    const record: TokenRecord = {
      id: `tok_${Math.random().toString(36).slice(2, 10)}`,
      model,
      provider,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      timestamp: new Date().toISOString(),
    };
    set((s) => ({
      lastRequest: usage,
      records: [...s.records, record],
      session: {
        inputTokens: s.session.inputTokens + usage.inputTokens,
        outputTokens: s.session.outputTokens + usage.outputTokens,
        totalTokens: s.session.totalTokens + usage.totalTokens,
      },
    }));
  },

  setContextLength: (contextLength) => set({ contextLength }),

  estimateInput: (messages) => {
    let total = 3;
    for (const m of messages) {
      total += estimateTokens(m.role) + estimateTokens(m.content) + 4;
    }
    return total;
  },

  reset: () =>
    set({
      session: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      lastRequest: null,
      records: [],
    }),

  formatted: () => {
    const { session, contextLength } = get();
    return {
      input: formatTokens(session.inputTokens),
      output: formatTokens(session.outputTokens),
      total: formatTokens(session.totalTokens),
      usagePercent: Math.min(100, (session.totalTokens / contextLength) * 100),
    };
  },
}));
