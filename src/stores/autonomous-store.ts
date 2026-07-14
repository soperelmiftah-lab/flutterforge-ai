"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  EngineeringPipeline, AutonomousSession, HistoryEntry,
  AutonomousMetrics, LearningSummary, LearningRecord,
} from "@/features/autonomous/types";

/**
 * Pipeline result returned by POST /autonomous/analyze.
 */
interface PipelineResult {
  pipeline: EngineeringPipeline;
  rootCause: any;
  repairPlan: any;
  selectedCandidate: any;
  simulation: any;
  validation: any;
  confidence: any;
  decision: any;
  verification?: any;
  regression?: any;
  success: boolean;
  aiRationale?: string;
}

interface AutonomousStoreState {
  result: PipelineResult | null;
  pipelines: EngineeringPipeline[];
  sessions: AutonomousSession[];
  history: HistoryEntry[];
  metrics: AutonomousMetrics | null;
  learning: LearningSummary | null;
  learningRecords: LearningRecord[];
  review: { findings: any[]; quality: any } | null;
  running: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  runPipeline: (input?: Record<string, unknown>) => Promise<PipelineResult | null>;
  refreshPipelines: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshLearning: () => Promise<void>;
  refreshReview: () => Promise<void>;
}

export const useAutonomousStore = create<AutonomousStoreState>((set, get) => ({
  result: null,
  pipelines: [],
  sessions: [],
  history: [],
  metrics: null,
  learning: null,
  learningRecords: [],
  review: null,
  running: false,
  error: null,

  hydrate: async () => {
    try {
      const [sessRes, histRes, metRes, learnRes] = await Promise.all([
        api.get<{ data: AutonomousSession[] }>("/autonomous/sessions"),
        api.get<{ data: HistoryEntry[] }>("/autonomous/history"),
        api.get<{ data: AutonomousMetrics }>("/autonomous/metrics"),
        api.get<{ data: LearningSummary; records: LearningRecord[] }>("/autonomous/learning"),
      ]);
      set({
        sessions: sessRes.data ?? [],
        history: histRes.data ?? [],
        metrics: metRes.data,
        learning: learnRes.data,
        learningRecords: learnRes.records ?? [],
      });
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : "Hydration failed" });
    }
  },

  runPipeline: async (input) => {
    set({ running: true, error: null });
    try {
      const res = await api.post<{ data: PipelineResult }>("/autonomous/analyze", input ?? {});
      const result = res.data;
      set({ result, running: false });
      void get().refreshSessions();
      void get().refreshHistory();
      void get().refreshMetrics();
      void get().refreshLearning();
      void get().refreshPipelines();
      return result;
    } catch (e: unknown) {
      set({ running: false, error: e instanceof Error ? e.message : "Pipeline failed" });
      return null;
    }
  },

  refreshPipelines: async () => {
    try {
      const res = await api.get<{ data: EngineeringPipeline[] }>("/autonomous/pipelines");
      set({ pipelines: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshSessions: async () => {
    try {
      const res = await api.get<{ data: AutonomousSession[] }>("/autonomous/sessions");
      set({ sessions: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshHistory: async () => {
    try {
      const res = await api.get<{ data: HistoryEntry[] }>("/autonomous/history");
      set({ history: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshMetrics: async () => {
    try {
      const res = await api.get<{ data: AutonomousMetrics }>("/autonomous/metrics");
      set({ metrics: res.data });
    } catch { /* ignore */ }
  },
  refreshLearning: async () => {
    try {
      const res = await api.get<{ data: LearningSummary; records: LearningRecord[] }>("/autonomous/learning");
      set({ learning: res.data, learningRecords: res.records ?? [] });
    } catch { /* ignore */ }
  },
  refreshReview: async () => {
    try {
      const res = await api.get<{ data: { findings: any[]; quality: any } }>("/autonomous/review");
      set({ review: res.data });
    } catch { /* ignore */ }
  },
}));
