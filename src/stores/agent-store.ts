"use client";

import { create } from "zustand";
import type { AgentDescriptor, AgentCategory } from "@/features/planner/types";
import { api } from "@/lib/api";

/**
 * Agent Store — lists registered agents with search + filter.
 */
interface AgentState {
  agents: AgentDescriptor[];
  loading: boolean;
  error: string | null;
  query: string;
  categoryFilter: AgentCategory | "all";

  hydrate: () => Promise<void>;
  setQuery: (q: string) => void;
  setCategoryFilter: (c: AgentCategory | "all") => void;
  filtered: () => AgentDescriptor[];
  getById: (id: string) => AgentDescriptor | undefined;
}

export const useAgentStore = create<AgentState>((set, get) => ({
  agents: [],
  loading: false,
  error: null,
  query: "",
  categoryFilter: "all",

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: AgentDescriptor[] }>("/planner/agents");
      set({ agents: response.data ?? [], loading: false });
    } catch {
      set({ loading: false, error: "Failed to load agents" });
    }
  },

  setQuery: (query) => set({ query }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),

  filtered: () => {
    const { agents, query, categoryFilter } = get();
    let out = categoryFilter === "all" ? agents : agents.filter((a) => a.category === categoryFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (a) => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.id.toLowerCase().includes(q)
      );
    }
    return out;
  },

  getById: (id) => get().agents.find((a) => a.id === id),
}));
