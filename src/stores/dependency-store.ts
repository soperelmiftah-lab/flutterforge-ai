"use client";

import { create } from "zustand";
import type {
  DependencyGraph,
  DependencyEdge,
  WorkspacePath,
} from "@/features/workspace-intelligence/types";
import { api } from "@/lib/api";

/**
 * Dependency Store — holds the dependency graph and provides queries for
 * file dependencies and dependents.
 */
interface DependencyState {
  graph: DependencyGraph | null;
  edges: DependencyEdge[];
  loading: boolean;
  error: string | null;

  buildGraph: () => Promise<void>;
  getDependencies: (path: WorkspacePath) => DependencyEdge[];
  getDependents: (path: WorkspacePath) => DependencyEdge[];
  getImportance: (path: WorkspacePath) => number;
}

export const useDependencyStore = create<DependencyState>((set, get) => ({
  graph: null,
  edges: [],
  loading: false,
  error: null,

  buildGraph: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: { edges: DependencyEdge[]; nodes: Array<{ path: string; inDegree: number; outDegree: number; importance: number }> } }>("/workspace/dependencies");
      const data = response.data;
      const nodes = new Map<WorkspacePath, { path: WorkspacePath; inDegree: number; outDegree: number; importance: number }>();
      for (const n of data.nodes) {
        nodes.set(n.path, n);
      }
      set({
        graph: { nodes, edges: data.edges, builtAt: new Date().toISOString() },
        edges: data.edges,
        loading: false,
      });
    } catch (e: unknown) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to build graph",
      });
    }
  },

  getDependencies: (path) => get().edges.filter((e) => e.from === path),
  getDependents: (path) => get().edges.filter((e) => e.to === path),
  getImportance: (path) => get().graph?.nodes.get(path)?.importance ?? 0,
}));
