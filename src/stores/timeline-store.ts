"use client";

import { create } from "zustand";
import type { TimelineEvent, TimelineEventType } from "@/features/planner/types";
import { api } from "@/lib/api";

/** Timeline Store — fetches timeline events. */
interface TimelineState {
  events: TimelineEvent[];
  loading: boolean;
  typeFilter: TimelineEventType | "all";

  hydrate: () => Promise<void>;
  setTypeFilter: (t: TimelineEventType | "all") => void;
  filtered: () => TimelineEvent[];
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  events: [],
  loading: false,
  typeFilter: "all",

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: TimelineEvent[] }>("/planner/timeline");
      set({ events: response.data ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setTypeFilter: (typeFilter) => set({ typeFilter }),

  filtered: () => {
    const { events, typeFilter } = get();
    return typeFilter === "all" ? events : events.filter((e) => e.type === typeFilter);
  },
}));
