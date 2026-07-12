"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProjectIndex,
  WorkspaceFile,
  WorkspaceFolder,
  ProjectKnowledgeBase,
  ProjectStatistics,
  WorkspacePath,
} from "@/features/workspace-intelligence/types";
import { api } from "@/lib/api";

/**
 * Workspace Index Store — holds the full project index (files, folders,
 * knowledge base, statistics) and triggers re-indexing via the API.
 */
interface WorkspaceIndexState {
  index: ProjectIndex | null;
  files: WorkspaceFile[];
  folders: WorkspaceFolder[];
  knowledgeBase: ProjectKnowledgeBase | null;
  statistics: ProjectStatistics | null;
  loading: boolean;
  error: string | null;
  lastIndexedAt: string | null;

  buildIndex: () => Promise<void>;
  getFile: (path: WorkspacePath) => WorkspaceFile | undefined;
  getSymbolsByKind: (kind: string) => WorkspaceFile["symbols"];
}

export const useWorkspaceIndexStore = create<WorkspaceIndexState>()(
  persist(
    (set, get) => ({
      index: null,
      files: [],
      folders: [],
      knowledgeBase: null,
      statistics: null,
      loading: false,
      error: null,
      lastIndexedAt: null,

      buildIndex: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get<{ data: ProjectIndex }>("/workspace/index");
          const idx = response.data;
          set({
            index: idx,
            files: idx.files,
            folders: idx.folders,
            knowledgeBase: idx.knowledgeBase,
            statistics: idx.statistics,
            loading: false,
            lastIndexedAt: idx.builtAt,
          });
        } catch (e: unknown) {
          set({
            loading: false,
            error: e instanceof Error ? e.message : "Failed to build index",
          });
        }
      },

      getFile: (path) => get().files.find((f) => f.path === path),

      getSymbolsByKind: (kind) =>
        get().files.flatMap((f) => f.symbols.filter((s) => s.kind === kind)),
    }),
    {
      name: "flutterforge-workspace-index",
      // Don't persist large data — always re-fetch on load.
      partialize: (state) => ({ lastIndexedAt: state.lastIndexedAt }),
    }
  )
);
