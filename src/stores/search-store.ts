"use client";

import { create } from "zustand";
import type {
  SearchResult,
  SearchQuery,
} from "@/features/workspace-intelligence/types";
import { api } from "@/lib/api";

/**
 * Search Store — runs semantic searches against the project index via the API
 * and tracks recent searches.
 */
interface SearchState {
  query: string;
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  recentSearches: string[];

  setQuery: (q: string) => void;
  search: (query?: string) => Promise<void>;
  clear: () => void;
  addRecentSearch: (q: string) => void;
}

export const useSearchStore = create<SearchState>((set, get) => ({
  query: "",
  results: [],
  loading: false,
  error: null,
  recentSearches: [],

  setQuery: (query) => set({ query }),

  search: async (query) => {
    const q = (query ?? get().query).trim();
    if (!q) {
      set({ results: [], error: null });
      return;
    }
    set({ loading: true, error: null, query: q });
    try {
      const payload: SearchQuery = { query: q, limit: 50, includeComments: true };
      const response = await api.post<{ data: SearchResult[] }>("/workspace/search", payload);
      set({ results: response.data ?? [], loading: false });
      get().addRecentSearch(q);
    } catch (e: unknown) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Search failed",
      });
    }
  },

  clear: () => set({ query: "", results: [], error: null }),

  addRecentSearch: (q) =>
    set((s) => ({
      recentSearches: [q, ...s.recentSearches.filter((r) => r !== q)].slice(0, 10),
    })),
}));
