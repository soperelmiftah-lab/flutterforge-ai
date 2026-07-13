"use client";

import { create } from "zustand";
import type { QueueItem, QueueMode } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * Queue Store — tracks the execution queue state.
 */
interface QueueState {
  items: QueueItem[];
  mode: QueueMode;
  loading: boolean;

  hydrate: () => Promise<void>;
  setMode: (mode: QueueMode) => void;
  stats: () => { queued: number; running: number; completed: number; failed: number; cancelled: number };
}

export const useQueueStore = create<QueueState>((set, get) => ({
  items: [],
  mode: "sequential",
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: QueueItem[] }>("/execution/queue");
      set({ items: response.data ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setMode: (mode) => set({ mode }),

  stats: () => {
    const items = get().items;
    return {
      queued: items.filter((i) => i.status === "queued").length,
      running: items.filter((i) => i.status === "running").length,
      completed: items.filter((i) => i.status === "success").length,
      failed: items.filter((i) => i.status === "failed").length,
      cancelled: items.filter((i) => i.status === "cancelled").length,
    };
  },
}));
