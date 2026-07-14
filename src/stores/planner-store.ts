"use client";

import { create } from "zustand";
import type { Intent, Goal, Plan, PlanningSession } from "@/features/planner/types";
import { api } from "@/lib/api";
import { generateThinkingSteps } from "@/features/planner/thinking";
import { getReasoningConfig } from "@/features/planner/reasoning";

/**
 * Planner Store — the top-level store for the Planner OS. Holds the current
 * session (intent, goal, plan) and triggers planning via the API.
 */
interface PlannerState {
  intent: Intent | null;
  goal: Goal | null;
  plan: Plan | null;
  session: PlanningSession | null;
  loading: boolean;
  error: string | null;
  input: string;

  setInput: (input: string) => void;
  planRequest: (input?: string) => Promise<void>;
  executePlan: () => Promise<void>;
  clear: () => void;
}

export const usePlannerStore = create<PlannerState>((set, get) => ({
  intent: null,
  goal: null,
  plan: null,
  session: null,
  loading: false,
  error: null,
  input: "",

  setInput: (input) => set({ input }),

  planRequest: async (input) => {
    const text = input ?? get().input;
    if (!text.trim()) return;
    set({ loading: true, error: null });
    try {
      const response = await api.post<{
        data: { intent: Intent; goal: Goal; plan: Plan; session: PlanningSession };
      }>("/planner/plan", { input: text });
      const { intent, goal, plan, session } = response.data;
      set({ intent, goal, plan, session, loading: false });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Planning failed" });
    }
  },

  executePlan: async () => {
    const { plan } = get();
    if (!plan) return;
    set({ loading: true, error: null });
    try {
      // Send the plan object directly in the body (more reliable than planId lookup)
      const response = await api.post<{ data: Plan; evaluation: any }>("/planner/execute", { plan });
      set({ plan: response.data, loading: false });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Execution failed" });
    }
  },

  clear: () => set({ intent: null, goal: null, plan: null, session: null, error: null, input: "" }),
}));

void generateThinkingSteps;
void getReasoningConfig;
