"use client";

import { create } from "zustand";
import type {
  ContextResult,
  RankedFile,
  WorkspacePath,
} from "@/features/workspace-intelligence/types";
import { api } from "@/lib/api";

/**
 * Context Store — assembles AI context for a user request via the API,
 * tracks the selected Top-N, and exposes the current context result.
 */
interface ContextState {
  result: ContextResult | null;
  loading: boolean;
  error: string | null;
  topN: 5 | 10 | 20;
  currentFile: WorkspacePath | null;
  pinnedFiles: WorkspacePath[];

  setTopN: (n: 5 | 10 | 20) => void;
  setCurrentFile: (path: WorkspacePath | null) => void;
  togglePin: (path: WorkspacePath) => void;
  assembleContext: (query: string, contextLength: number) => Promise<void>;
  clear: () => void;
}

export const useContextStore = create<ContextState>((set, get) => ({
  result: null,
  loading: false,
  error: null,
  topN: 10,
  currentFile: null,
  pinnedFiles: [],

  setTopN: (topN) => set({ topN }),

  setCurrentFile: (currentFile) => set({ currentFile }),

  togglePin: (path) =>
    set((s) => ({
      pinnedFiles: s.pinnedFiles.includes(path)
        ? s.pinnedFiles.filter((p) => p !== path)
        : [...s.pinnedFiles, path],
    })),

  assembleContext: async (query, contextLength) => {
    set({ loading: true, error: null });
    try {
      const { topN, currentFile, pinnedFiles } = get();
      const payload = {
        query,
        topN,
        currentFile,
        pinnedFiles,
        contextLength,
      };
      const response = await api.post<{ data: ContextResult }>("/workspace/context", payload);
      set({ result: response.data, loading: false });
    } catch (e: unknown) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to assemble context",
      });
    }
  },

  clear: () => set({ result: null, error: null }),
}));

export type { RankedFile };
