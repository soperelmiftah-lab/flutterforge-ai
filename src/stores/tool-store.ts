"use client";

import { create } from "zustand";
import type { ToolDescriptor, ToolCategory } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * Tool Store — lists all registered tools with search + filter.
 */
interface ToolState {
  tools: ToolDescriptor[];
  loading: boolean;
  error: string | null;
  query: string;
  categoryFilter: ToolCategory | "all";

  hydrate: () => Promise<void>;
  setQuery: (q: string) => void;
  setCategoryFilter: (c: ToolCategory | "all") => void;
  filtered: () => ToolDescriptor[];
  getById: (id: string) => ToolDescriptor | undefined;
}

export const useToolStore = create<ToolState>((set, get) => ({
  tools: [],
  loading: false,
  error: null,
  query: "",
  categoryFilter: "all",

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: ToolDescriptor[] }>("/execution/tools");
      set({ tools: response.data ?? [], loading: false });
    } catch {
      set({ loading: false, error: "Failed to load tools" });
    }
  },

  setQuery: (query) => set({ query }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

  filtered: () => {
    const { tools, query, categoryFilter } = get();
    let out = categoryFilter === "all" ? tools : tools.filter((t) => t.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return out;
  },

  getById: (id) => get().tools.find((t) => t.id === id),
}));
