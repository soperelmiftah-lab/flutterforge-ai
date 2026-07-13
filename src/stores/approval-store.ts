"use client";

import { create } from "zustand";
import type { ApprovalRequest, ApprovalStatus } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * Approval Store — manages pending approval requests. The UI (Approval
 * Queue) subscribes to approve/reject actions.
 */
interface ApprovalState {
  approvals: ApprovalRequest[];
  loading: boolean;

  hydrate: () => Promise<void>;
  approve: (requestId: string) => Promise<void>;
  reject: (requestId: string) => Promise<void>;
  pending: () => ApprovalRequest[];
  count: () => number;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  approvals: [],
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: ApprovalRequest[] }>("/execution/history");
      // Note: the history endpoint returns history entries; approvals come from a dedicated source.
      // For Phase 4 we fetch from a hypothetical approvals endpoint, fallback to empty.
      void response;
      set({ approvals: [], loading: false });
    } catch {
      set({ loading: false });
    }
  },

  approve: async (requestId) => {
    try {
      await api.post("/execution/approve", { requestId });
      set((s) => ({
        approvals: s.approvals.map((a) =>
          a.requestId === requestId
            ? { ...a, status: "approved" as ApprovalStatus, decidedAt: new Date().toISOString() }
            : a
        ),
      }));
    } catch {
      /* ignore */
    }
  },

  reject: async (requestId) => {
    try {
      await api.post("/execution/reject", { requestId });
      set((s) => ({
        approvals: s.approvals.map((a) =>
          a.requestId === requestId
            ? { ...a, status: "rejected" as ApprovalStatus, decidedAt: new Date().toISOString() }
            : a
        ),
      }));
    } catch {
      /* ignore */
    }
  },

  pending: () => get().approvals.filter((a) => a.status === "pending"),
  count: () => get().approvals.filter((a) => a.status === "pending").length,
}));
