"use client";

import { create } from "zustand";
import type { ToolTelemetry } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * Telemetry Store — fetches per-tool telemetry metrics.
 */
interface TelemetryState {
  tools: ToolTelemetry[];
  loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  summary: () => {
    totalExecutions: number;
    totalSuccess: number;
    totalFailures: number;
    overallSuccessRate: number;
    averageDurationMs: number;
  };
}

export const useTelemetryStore = create<TelemetryState>((set, get) => ({
  tools: [],
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true });
    try {
      // Telemetry is derived from history; in a full impl this would be a dedicated endpoint.
      void api;
      set({ tools: [], loading: false });
    } catch {
      set({ loading: false, error: "Failed to load telemetry" });
    }
  },

  summary: () => {
    const tools = get().tools;
    const totalExecutions = tools.reduce((s, t) => s + t.executionCount, 0);
    const totalSuccess = tools.reduce((s, t) => s + t.successCount, 0);
    const totalFailures = tools.reduce((s, t) => s + t.failureCount, 0);
    const totalDuration = tools.reduce((s, t) => s + t.totalDurationMs, 0);
    return {
      totalExecutions,
      totalSuccess,
      totalFailures,
      overallSuccessRate: totalExecutions > 0 ? totalSuccess / totalExecutions : 0,
      averageDurationMs: totalExecutions > 0 ? Math.round(totalDuration / totalExecutions) : 0,
    };
  },
}));
