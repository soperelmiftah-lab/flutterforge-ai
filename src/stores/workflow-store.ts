"use client";

import { create } from "zustand";
import type { Workflow } from "@/features/planner/types";
import { api } from "@/lib/api";

/** Workflow Store — lists reusable workflows. */
interface WorkflowState {
  workflows: Workflow[];
  loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  getById: (id: string) => Workflow | undefined;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflows: [],
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: Workflow[] }>("/planner/workflows");
      set({ workflows: response.data ?? [], loading: false });
    } catch {
      set({ loading: false, error: "Failed to load workflows" });
    }
  },

  getById: (id) => get().workflows.find((w) => w.id === id),
}));
