"use client";

import { create } from "zustand";
import type { ToolChain, SimulationResult, Recommendation, RecoveryPlan } from "@/features/tool-intelligence/types";
import { api } from "@/lib/api";
import type { IntentType } from "@/features/planner/types";

/**
 * Tool Intelligence Store — the top-level store for the Tool Intelligence
 * Layer. Holds the current chain, simulation, recommendations, and recovery
 * plans.
 */
interface ToolIntelligenceState {
  chain: ToolChain | null;
  optimizedChain: ToolChain | null;
  simulation: SimulationResult | null;
  recommendations: Recommendation[];
  recoveryPlan: RecoveryPlan | null;
  loading: boolean;
  error: string | null;
  objective: string;
  intentType: IntentType;

  setObjective: (o: string) => void;
  setIntentType: (i: IntentType) => void;
  buildChain: (objective?: string, intentType?: IntentType) => Promise<void>;
  optimize: () => Promise<void>;
  simulate: () => Promise<void>;
  clear: () => void;
}

export const useToolIntelligenceStore = create<ToolIntelligenceState>((set, get) => ({
  chain: null,
  optimizedChain: null,
  simulation: null,
  recommendations: [],
  recoveryPlan: null,
  loading: false,
  error: null,
  objective: "",
  intentType: "feature-request",

  setObjective: (objective) => set({ objective }),
  setIntentType: (intentType) => set({ intentType }),

  buildChain: async (objective, intentType) => {
    const obj = objective ?? get().objective;
    const intent = intentType ?? get().intentType;
    if (!obj.trim()) return;
    set({ loading: true, error: null });
    try {
      const response = await api.post<{
        data: { chain: ToolChain; recommendations: Recommendation[] };
      }>("/tools/analyze", { objective: obj, intentType: intent });
      set({
        chain: response.data.chain,
        optimizedChain: null,
        simulation: null,
        recommendations: response.data.recommendations ?? [],
        loading: false,
      });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Analysis failed" });
    }
  },

  optimize: async () => {
    const { chain } = get();
    if (!chain) return;
    set({ loading: true, error: null });
    try {
      const response = await api.post<{ data: ToolChain }>("/tools/optimize", { chainId: chain.id });
      set({ optimizedChain: response.data, loading: false });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Optimization failed" });
    }
  },

  simulate: async () => {
    const { chain } = get();
    if (!chain) return;
    set({ loading: true, error: null });
    try {
      const response = await api.post<{ data: SimulationResult }>("/tools/simulate", { chainId: chain.id });
      set({ simulation: response.data, loading: false });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Simulation failed" });
    }
  },

  clear: () => set({ chain: null, optimizedChain: null, simulation: null, recommendations: [], recoveryPlan: null, error: null }),
}));
