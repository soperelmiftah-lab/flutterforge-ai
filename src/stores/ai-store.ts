"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AISettings, ReasoningEffort } from "@/features/ai/settings/types";
import { defaultAISettings } from "@/features/ai/settings/types";
import type { ProviderId } from "@/features/ai/provider/types";

/**
 * AI store — the top-level AI configuration store. Persisted to localStorage.
 * Holds the active provider, model, and all generation parameters. The chat
 * store and UI components read from here.
 */
interface AIStoreState extends AISettings {
  setProvider: (provider: ProviderId) => void;
  setModel: (model: string) => void;
  setTemperature: (t: number) => void;
  setTopP: (p: number) => void;
  setMaxTokens: (n: number) => void;
  setPresencePenalty: (n: number) => void;
  setFrequencyPenalty: (n: number) => void;
  setReasoningEffort: (e: ReasoningEffort) => void;
  setStreaming: (s: boolean) => void;
  setContextLength: (n: number) => void;
  setShowPaidModels: (s: boolean) => void;
  setCustomInstructions: (s: string) => void;
  setBeginnerMode: (b: boolean) => void;
  update: (partial: Partial<AISettings>) => void;
  reset: () => void;
}

export const useAIStore = create<AIStoreState>()(
  persist(
    (set) => ({
      ...defaultAISettings,
      setProvider: (provider) => set({ provider, model: "" }),
      setModel: (model) => set({ model }),
      setTemperature: (temperature) => set({ temperature }),
      setTopP: (topP) => set({ topP }),
      setMaxTokens: (maxTokens) => set({ maxTokens }),
      setPresencePenalty: (presencePenalty) => set({ presencePenalty }),
      setFrequencyPenalty: (frequencyPenalty) => set({ frequencyPenalty }),
      setReasoningEffort: (reasoningEffort) => set({ reasoningEffort }),
      setStreaming: (streaming) => set({ streaming }),
      setContextLength: (contextLength) => set({ contextLength }),
      setShowPaidModels: (showPaidModels) => set({ showPaidModels }),
      setCustomInstructions: (customInstructions) => set({ customInstructions }),
      setBeginnerMode: (beginnerMode) => set({ beginnerMode }),
      update: (partial) => set(partial),
      reset: () => set({ ...defaultAISettings }),
    }),
    { name: "flutterforge-ai-settings" }
  )
);
