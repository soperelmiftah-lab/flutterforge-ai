"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  VisionReport, VisionHistoryEntry, VisionMetrics, VisionSession,
  ComparisonResult, VisionInput,
} from "@/features/vision-ai/types";

/**
 * Vision AI Store — top-level store for the Vision AI & Autonomous UI
 * Analysis Platform. Holds the current report, history, metrics, sessions.
 */
interface VisionAIStoreState {
  report: VisionReport | null;
  reports: VisionReport[];
  history: VisionHistoryEntry[];
  metrics: VisionMetrics | null;
  sessions: VisionSession[];
  analyzing: boolean;
  error: string | null;
  comparison: ComparisonResult | null;
  comparing: boolean;

  hydrate: () => Promise<void>;
  runAnalysis: (input?: Partial<VisionInput>) => Promise<VisionReport | null>;
  refreshHistory: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  compare: (aId: string, bId: string) => Promise<ComparisonResult | null>;
}

export const useVisionAIStore = create<VisionAIStoreState>((set, get) => ({
  report: null,
  reports: [],
  history: [],
  metrics: null,
  sessions: [],
  analyzing: false,
  error: null,
  comparison: null,
  comparing: false,

  hydrate: async () => {
    try {
      const [repRes, histRes, metRes, sessRes] = await Promise.all([
        api.get<{ data: VisionReport[] }>("/vision/reports"),
        api.get<{ data: VisionHistoryEntry[] }>("/vision/history"),
        api.get<{ data: VisionMetrics }>("/vision/metrics"),
        api.get<{ data: VisionSession[] }>("/vision/sessions"),
      ]);
      set({
        reports: repRes.data ?? [],
        report: (repRes.data ?? [])[0] ?? null,
        history: histRes.data ?? [],
        metrics: metRes.data,
        sessions: sessRes.data ?? [],
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Hydration failed" });
    }
  },

  runAnalysis: async (input) => {
    set({ analyzing: true, error: null });
    try {
      const res = await api.post<{ data: VisionReport }>("/vision/analyze", input ?? {});
      const report = res.data;
      set({
        report,
        reports: [report, ...get().reports.filter((r) => r.id !== report.id)].slice(0, 20),
        analyzing: false,
      });
      void get().refreshHistory();
      void get().refreshMetrics();
      void get().refreshSessions();
      return report;
    } catch (e: unknown) {
      set({ analyzing: false, error: e instanceof Error ? e.message : "Analysis failed" });
      return null;
    }
  },

  refreshHistory: async () => {
    try {
      const res = await api.get<{ data: VisionHistoryEntry[] }>("/vision/history");
      set({ history: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshMetrics: async () => {
    try {
      const res = await api.get<{ data: VisionMetrics }>("/vision/metrics");
      set({ metrics: res.data });
    } catch { /* ignore */ }
  },
  refreshSessions: async () => {
    try {
      const res = await api.get<{ data: VisionSession[] }>("/vision/sessions");
      set({ sessions: res.data ?? [] });
    } catch { /* ignore */ }
  },

  compare: async (aId: string, bId: string) => {
    set({ comparing: true, error: null });
    try {
      const res = await api.post<{ data: ComparisonResult }>("/vision/compare", {
        screenshotA: aId, screenshotB: bId,
      });
      set({ comparison: res.data, comparing: false });
      return res.data;
    } catch (e: unknown) {
      set({ comparing: false, error: e instanceof Error ? e.message : "Compare failed" });
      return null;
    }
  },
}));
