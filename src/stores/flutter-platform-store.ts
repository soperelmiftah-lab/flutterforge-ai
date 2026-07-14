"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type { GenerationResult, GenerationMode } from "@/features/flutter-platform/generator";
import type { ReviewResult } from "@/features/flutter-platform/review";
import type { RepairResult } from "@/features/flutter-platform/repair";
import type { PerformanceReport } from "@/features/flutter-platform/types";
import type { FlutterTemplateWithFiles } from "@/features/flutter-platform/templates";
import type { FlutterAnalysisResult } from "@/features/flutter-platform/analysis";
import type { BuildReadiness } from "@/features/flutter-platform/types";
import type { ExecutionResult } from "@/features/execution/types";

/**
 * Flutter Platform Store — holds the current generated code, review/repair
 * results, templates list, and build readiness. All async actions call the
 * API; the store holds the response.
 */
interface FlutterPlatformState {
  // Generator
  description: string;
  mode: GenerationMode;
  className: string;
  generation: GenerationResult | null;
  generating: boolean;

  // Review / Repair / Performance / Analysis
  reviewCode: string;
  review: ReviewResult | null;
  reviewing: boolean;

  repairCode: string;
  repair: RepairResult | null;
  repairing: boolean;

  perfCode: string;
  performance: PerformanceReport | null;
  analyzingPerf: boolean;

  analysis: FlutterAnalysisResult | null;
  analyzingProject: boolean;

  // Templates + scaffolding
  templates: FlutterTemplateWithFiles[];
  scaffolding: boolean;
  scaffoldResult: Array<{ path: string; result: ExecutionResult }> | null;

  // Build readiness
  buildReadiness: BuildReadiness | null;
  checkingBuild: boolean;

  // Save-to-VFS
  saving: boolean;
  saveResult: ExecutionResult | null;

  error: string | null;

  // Setters
  setDescription: (d: string) => void;
  setMode: (m: GenerationMode) => void;
  setClassName: (c: string) => void;
  setReviewCode: (c: string) => void;
  setRepairCode: (c: string) => void;
  setPerfCode: (c: string) => void;

  // Actions
  generate: () => Promise<void>;
  runReview: () => Promise<void>;
  runRepair: () => Promise<void>;
  runPerformance: () => Promise<void>;
  runAnalysis: (code: string) => Promise<void>;
  fetchTemplates: () => Promise<void>;
  scaffold: (templateId: string) => Promise<void>;
  checkBuild: () => Promise<void>;
  saveToWorkspace: (path: string, content: string) => Promise<void>;
  clear: () => void;
}

export const useFlutterPlatformStore = create<FlutterPlatformState>((set, get) => ({
  description: "",
  mode: "screen",
  className: "",
  generation: null,
  generating: false,

  reviewCode: "",
  review: null,
  reviewing: false,

  repairCode: "",
  repair: null,
  repairing: false,

  perfCode: "",
  performance: null,
  analyzingPerf: false,

  analysis: null,
  analyzingProject: false,

  templates: [],
  scaffolding: false,
  scaffoldResult: null,

  buildReadiness: null,
  checkingBuild: false,

  saving: false,
  saveResult: null,

  error: null,

  setDescription: (description) => set({ description }),
  setMode: (mode) => set({ mode }),
  setClassName: (className) => set({ className }),
  setReviewCode: (reviewCode) => set({ reviewCode }),
  setRepairCode: (repairCode) => set({ repairCode }),
  setPerfCode: (perfCode) => set({ perfCode }),

  generate: async () => {
    const { description, mode, className } = get();
    if (!description.trim()) return;
    set({ generating: true, error: null });
    try {
      const response = await api.post<{ data: GenerationResult }>(
        "/flutter/generate",
        { description, mode, className: className || undefined }
      );
      set({ generation: response.data, generating: false });
    } catch (e: unknown) {
      set({ generating: false, error: e instanceof Error ? e.message : "Generation failed" });
    }
  },

  runReview: async () => {
    const { reviewCode } = get();
    if (!reviewCode.trim()) return;
    set({ reviewing: true, error: null });
    try {
      const response = await api.post<{ data: ReviewResult }>(
        "/flutter/review",
        { code: reviewCode }
      );
      set({ review: response.data, reviewing: false });
    } catch (e: unknown) {
      set({ reviewing: false, error: e instanceof Error ? e.message : "Review failed" });
    }
  },

  runRepair: async () => {
    const { repairCode } = get();
    if (!repairCode.trim()) return;
    set({ repairing: true, error: null });
    try {
      const response = await api.post<{ data: RepairResult }>(
        "/flutter/repair",
        { code: repairCode }
      );
      set({ repair: response.data, repairing: false });
    } catch (e: unknown) {
      set({ repairing: false, error: e instanceof Error ? e.message : "Repair failed" });
    }
  },

  runPerformance: async () => {
    const { perfCode } = get();
    if (!perfCode.trim()) return;
    set({ analyzingPerf: true, error: null });
    try {
      const response = await api.post<{ data: PerformanceReport }>(
        "/flutter/performance",
        { code: perfCode }
      );
      set({ performance: response.data, analyzingPerf: false });
    } catch (e: unknown) {
      set({ analyzingPerf: false, error: e instanceof Error ? e.message : "Performance analysis failed" });
    }
  },

  runAnalysis: async (code: string) => {
    if (!code.trim()) return;
    set({ analyzingProject: true, error: null });
    try {
      const response = await api.post<{ data: FlutterAnalysisResult }>(
        "/flutter/analyze",
        { code }
      );
      set({ analysis: response.data, analyzingProject: false });
    } catch (e: unknown) {
      set({ analyzingProject: false, error: e instanceof Error ? e.message : "Analysis failed" });
    }
  },

  fetchTemplates: async () => {
    try {
      const response = await api.get<{ data: FlutterTemplateWithFiles[] }>(
        "/flutter/templates"
      );
      set({ templates: response.data ?? [] });
    } catch {
      /* ignore */
    }
  },

  scaffold: async (templateId: string) => {
    set({ scaffolding: true, error: null, scaffoldResult: null });
    try {
      const response = await api.post<{
        data: { templateId: string; templateName: string; files: Array<{ path: string; result: ExecutionResult }> };
      }>("/flutter/scaffold", { templateId });
      set({ scaffoldResult: response.data.files, scaffolding: false });
    } catch (e: unknown) {
      set({ scaffolding: false, error: e instanceof Error ? e.message : "Scaffold failed" });
    }
  },

  checkBuild: async () => {
    set({ checkingBuild: true, error: null });
    try {
      const response = await api.get<{ data: BuildReadiness }>("/flutter/build");
      set({ buildReadiness: response.data, checkingBuild: false });
    } catch (e: unknown) {
      set({ checkingBuild: false, error: e instanceof Error ? e.message : "Build check failed" });
    }
  },

  saveToWorkspace: async (path: string, content: string) => {
    set({ saving: true, error: null, saveResult: null });
    try {
      const response = await api.post<{ data: ExecutionResult }>(
        "/flutter/save",
        { path, content }
      );
      set({ saveResult: response.data, saving: false });
    } catch (e: unknown) {
      set({ saving: false, error: e instanceof Error ? e.message : "Save failed" });
    }
  },

  clear: () =>
    set({
      generation: null,
      review: null,
      repair: null,
      performance: null,
      analysis: null,
      scaffoldResult: null,
      saveResult: null,
      buildReadiness: null,
      error: null,
    }),
}));
