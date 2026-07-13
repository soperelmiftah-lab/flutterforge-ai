"use client";

import { create } from "zustand";
import type { PlannerMetrics } from "@/features/planner/types";
import { api } from "@/lib/api";

/** Metrics Store — fetches planner metrics. */
interface MetricsState {
  metrics: PlannerMetrics | null;
  loading: boolean;

  hydrate: () => Promise<void>;
}

export const usePlannerMetricsStore = create<MetricsState>((set) => ({
  metrics: null,
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: PlannerMetrics }>("/planner/metrics");
      set({ metrics: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
