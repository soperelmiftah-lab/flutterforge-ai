"use client";

import { create } from "zustand";
import type { ModelDescriptor, ModelFilter } from "@/features/ai/models/types";
import type { ProviderId } from "@/features/ai/provider/types";
import { api } from "@/lib/api";

/** Sync the AI store's provider + model when a model is selected. */
function syncAIStore(modelId: string, provider: ProviderId) {
  // Lazy import to avoid circular dependency at module load time.
  import("./ai-store").then(({ useAIStore }) => {
    useAIStore.getState().update({ provider, model: modelId });
  });
}

/**
 * Model store — manages the dynamic model registry on the client. Fetches
 * models from the API (which proxies to providers), applies the free/paid
 * filter, and tracks the selected model.
 */
interface ModelStoreState {
  models: ModelDescriptor[];
  loading: boolean;
  error: string | null;
  showPaid: boolean;
  query: string;
  selectedModelId: string | null;
  hydrate: () => Promise<void>;
  setShowPaid: (show: boolean) => void;
  setQuery: (q: string) => void;
  selectModel: (id: string) => void;
  filtered: () => ModelDescriptor[];
  getSelected: () => ModelDescriptor | undefined;
}

export const useModelStore = create<ModelStoreState>((set, get) => ({
  models: [],
  loading: false,
  error: null,
  showPaid: false,
  query: "",
  selectedModelId: null,

  hydrate: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<{ data: ModelDescriptor[] }>("/ai/models");
      const data = response.data ?? [];
      set({ models: data, loading: false });
      // Auto-select: prefer Forge (built-in, no key needed), then first free model.
      if (!get().selectedModelId) {
        const forgeModel = data.find((m) => m.provider === "forge" && m.isFree);
        const firstFree = forgeModel ?? data.find((m) => m.isFree);
        if (firstFree) {
          set({ selectedModelId: firstFree.id });
          // Sync the AI store's provider + model to match.
          syncAIStore(firstFree.id, firstFree.provider);
        }
      }
    } catch (e: unknown) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "Failed to load models",
      });
    }
  },

  setShowPaid: (showPaid) => set({ showPaid }),
  setQuery: (query) => set({ query }),
  selectModel: (id) => {
    set({ selectedModelId: id });
    // Sync the AI store's provider to match the selected model's provider.
    const model = get().models.find((m) => m.id === id);
    if (model) {
      syncAIStore(id, model.provider);
    }
  },

  filtered: () => {
    const { models, showPaid, query } = get();
    const arr = Array.isArray(models) ? models : [];
    let out = showPaid ? arr : arr.filter((m) => m.isFree);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
      );
    }
    return out;
  },

  getSelected: () => {
    const { models, selectedModelId } = get();
    return models.find((m) => m.id === selectedModelId);
  },
}));
