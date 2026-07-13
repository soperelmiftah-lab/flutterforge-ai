"use client";

import { create } from "zustand";
import type { ExecutionRequest, ExecutionResult, ExecutionStatus } from "@/features/execution/types";
import { api } from "@/lib/api";

/**
 * Execution Store — tracks active, queued, and completed executions.
 * Bridges the UI (Execution Center) to the API.
 */
interface ExecutionState {
  /** Active + recent executions keyed by request id. */
  executions: Record<string, { request: ExecutionRequest; result?: ExecutionResult }>;
  loading: boolean;
  error: string | null;

  execute: (request: ExecutionRequest) => Promise<ExecutionResult>;
  refresh: () => Promise<void>;
  clear: () => void;
  getByStatus: (status: ExecutionStatus) => Array<{ request: ExecutionRequest; result?: ExecutionResult }>;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  executions: {},
  loading: false,
  error: null,

  execute: async (request) => {
    set({ loading: true, error: null });
    // Optimistically add the request.
    set((s) => ({
      executions: { ...s.executions, [request.id]: { request } },
    }));
    try {
      const response = await api.post<{ data: ExecutionResult }>("/execution/execute", request);
      const result = response.data;
      set((s) => ({
        executions: { ...s.executions, [request.id]: { request, result } },
        loading: false,
      }));
      return result;
    } catch (e: unknown) {
      const error = e instanceof Error ? e.message : "Execution failed";
      set((s) => ({
        executions: {
          ...s.executions,
          [request.id]: {
            request,
            result: {
              requestId: request.id,
              status: "failed",
              error,
              durationMs: 0,
              finishedAt: new Date().toISOString(),
            },
          },
        },
        loading: false,
        error,
      }));
      throw e;
    }
  },

  refresh: async () => {
    try {
      const response = await api.get<{ data: Array<{ request: ExecutionRequest; result?: ExecutionResult }> }>("/execution/history");
      const map: Record<string, { request: ExecutionRequest; result?: ExecutionResult }> = {};
      for (const item of response.data ?? []) {
        map[item.request.id] = item;
      }
      set({ executions: map });
    } catch {
      /* ignore */
    }
  },

  clear: () => set({ executions: {}, error: null }),

  getByStatus: (status) =>
    Object.values(get().executions).filter((e) => e.result?.status === status),
}));
