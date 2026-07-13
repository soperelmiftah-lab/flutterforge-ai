"use client";

import { create } from "zustand";
import type { ToolIntelligenceMetrics } from "@/features/tool-intelligence/types";
import { api } from "@/lib/api";

/** Metrics Store for Tool Intelligence. */
interface TIMetricsState {
  metrics: ToolIntelligenceMetrics | null;
  loading: boolean;
  hydrate: () => Promise<void>;
}

export const useTIMetricsStore = create<TIMetricsState>((set) => ({
  metrics: null,
  loading: false,
  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: ToolIntelligenceMetrics }>("/tools/metrics");
      set({ metrics: response.data, loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
