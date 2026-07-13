"use client";

import { create } from "zustand";
import type { HistoryEntry, ToolCategory, ExecutionStatus } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * History Store — fetches and filters execution history.
 */
interface HistoryState {
  entries: HistoryEntry[];
  loading: boolean;
  error: string | null;
  categoryFilter: ToolCategory | "all";
  statusFilter: ExecutionStatus | "all";

  hydrate: () => Promise<void>;
  setCategoryFilter: (c: ToolCategory | "all") => void;
  setStatusFilter: (s: ExecutionStatus | "all") => void;
  filtered: () => HistoryEntry[];
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  entries: [],
  loading: false,
  error: null,
  categoryFilter: "all",
  statusFilter: "all",

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: HistoryEntry[] }>("/execution/history");
      set({ entries: response.data ?? [], loading: false });
    } catch {
      set({ loading: false, error: "Failed to load history" });
    }
  },

  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),

  filtered: () => {
    const { entries, categoryFilter, statusFilter } = get();
    let out = entries;
    if (categoryFilter !== "all") out = out.filter((e) => e.category === categoryFilter);
    if (statusFilter !== "all") out = out.filter((e) => e.status === statusFilter);
    return out;
  },
}));
