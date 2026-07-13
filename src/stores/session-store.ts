"use client";

import { create } from "zustand";
import type { PlanningSession } from "@/features/planner/types";
import { api } from "@/lib/api";

/** Session Store — lists planning sessions. */
interface SessionState {
  sessions: PlanningSession[];
  loading: boolean;

  hydrate: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  sessions: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: PlanningSession[] }>("/planner/sessions");
      set({ sessions: response.data ?? [], loading: false });
    } catch {
      set({ loading: false });
    }
  },
}));
