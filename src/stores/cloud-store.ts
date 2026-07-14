"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  Worker, CloudJob, BuildFarmJob, FarmDevice, Artifact,
  CloudHistoryEntry, CloudMetrics, MonitoringSnapshot, CloudSession,
  RuntimeAdapter, JobType, RuntimeType, BuildTarget, BuildMode,
} from "@/features/cloud/types";

interface CloudLogEntry {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  timestamp: string;
}

interface CloudStoreState {
  workers: Worker[];
  jobQueue: CloudJob[];
  completedJobs: CloudJob[];
  builds: BuildFarmJob[];
  devices: FarmDevice[];
  artifacts: Artifact[];
  history: CloudHistoryEntry[];
  metrics: CloudMetrics | null;
  monitoring: MonitoringSnapshot | null;
  sessions: CloudSession[];
  adapters: RuntimeAdapter[];
  logs: CloudLogEntry[];
  loading: boolean;
  error: string | null;

  hydrate: () => Promise<void>;
  refreshWorkers: () => Promise<void>;
  refreshJobs: () => Promise<void>;
  refreshBuilds: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshArtifacts: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  refreshAdapters: () => Promise<void>;
  refreshSessions: () => Promise<void>;

  addWorker: (params: { name: string; type: RuntimeType; capabilities: string[] }) => Promise<void>;
  removeWorker: (id: string) => Promise<void>;
  toggleWorker: (id: string) => Promise<void>;

  enqueueJob: (params: { type: JobType; command?: string; args?: string[]; priority?: number; runtimeType?: RuntimeType }) => Promise<CloudJob | null>;
  cancelJob: (jobId: string) => Promise<void>;

  queueBuild: (target: BuildTarget, mode: BuildMode) => Promise<BuildFarmJob | null>;
  submitRun: (deviceId: string) => Promise<CloudJob | null>;
  submitTest: () => Promise<CloudJob | null>;

  reserveDevice: (deviceId: string) => Promise<void>;
  releaseDevice: (deviceId: string) => Promise<void>;
  deleteArtifact: (id: string) => Promise<void>;
  clearLogs: () => Promise<void>;
}

export const useCloudStore = create<CloudStoreState>((set, get) => ({
  workers: [],
  jobQueue: [],
  completedJobs: [],
  builds: [],
  devices: [],
  artifacts: [],
  history: [],
  metrics: null,
  monitoring: null,
  sessions: [],
  adapters: [],
  logs: [],
  loading: false,
  error: null,

  hydrate: async () => {
    set({ loading: true });
    try {
      const [wRes, jRes, bRes, dRes, aRes, hRes, mRes, lRes, adRes, sRes] = await Promise.all([
        api.get<{ data: Worker[] }>("/cloud/workers"),
        api.get<{ data: { queue: CloudJob[]; completed: CloudJob[] } }>("/cloud/jobs"),
        api.get<{ data: BuildFarmJob[] }>("/cloud/build"),
        api.get<{ data: FarmDevice[] }>("/cloud/device-farm"),
        api.get<{ data: Artifact[] }>("/cloud/artifacts"),
        api.get<{ data: CloudHistoryEntry[] }>("/cloud/history"),
        api.get<{ data: { metrics: CloudMetrics; monitoring: MonitoringSnapshot } }>("/cloud/metrics"),
        api.get<{ data: CloudLogEntry[] }>("/cloud/logs"),
        api.get<{ data: RuntimeAdapter[] }>("/cloud/adapters"),
        api.get<{ data: CloudSession[] }>("/cloud/sessions"),
      ]);
      set({
        workers: wRes.data ?? [],
        jobQueue: jRes.data?.queue ?? [],
        completedJobs: jRes.data?.completed ?? [],
        builds: bRes.data ?? [],
        devices: dRes.data ?? [],
        artifacts: aRes.data ?? [],
        history: hRes.data ?? [],
        metrics: mRes.data?.metrics ?? null,
        monitoring: mRes.data?.monitoring ?? null,
        logs: lRes.data ?? [],
        adapters: adRes.data ?? [],
        sessions: sRes.data ?? [],
        loading: false,
      });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Hydration failed" });
    }
  },

  refreshWorkers: async () => {
    try { const r = await api.get<{ data: Worker[] }>("/cloud/workers"); set({ workers: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshJobs: async () => {
    try {
      const r = await api.get<{ data: { queue: CloudJob[]; completed: CloudJob[] } }>("/cloud/jobs");
      set({ jobQueue: r.data?.queue ?? [], completedJobs: r.data?.completed ?? [] });
    } catch { /* ignore */ }
  },
  refreshBuilds: async () => {
    try { const r = await api.get<{ data: BuildFarmJob[] }>("/cloud/build"); set({ builds: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshDevices: async () => {
    try { const r = await api.get<{ data: FarmDevice[] }>("/cloud/device-farm"); set({ devices: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshArtifacts: async () => {
    try { const r = await api.get<{ data: Artifact[] }>("/cloud/artifacts"); set({ artifacts: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshHistory: async () => {
    try { const r = await api.get<{ data: CloudHistoryEntry[] }>("/cloud/history"); set({ history: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshMetrics: async () => {
    try {
      const r = await api.get<{ data: { metrics: CloudMetrics; monitoring: MonitoringSnapshot } }>("/cloud/metrics");
      set({ metrics: r.data?.metrics ?? null, monitoring: r.data?.monitoring ?? null });
    } catch { /* ignore */ }
  },
  refreshLogs: async () => {
    try { const r = await api.get<{ data: CloudLogEntry[] }>("/cloud/logs"); set({ logs: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshAdapters: async () => {
    try { const r = await api.get<{ data: RuntimeAdapter[] }>("/cloud/adapters"); set({ adapters: r.data ?? [] }); } catch { /* ignore */ }
  },
  refreshSessions: async () => {
    try { const r = await api.get<{ data: CloudSession[] }>("/cloud/sessions"); set({ sessions: r.data ?? [] }); } catch { /* ignore */ }
  },

  addWorker: async (params) => {
    try { await api.post("/cloud/workers", { action: "add", ...params }); await get().refreshWorkers(); } catch { /* ignore */ }
  },
  removeWorker: async (id) => {
    try { await api.post("/cloud/workers", { action: "remove", id }); await get().refreshWorkers(); } catch { /* ignore */ }
  },
  toggleWorker: async (id) => {
    try { await api.post("/cloud/workers", { action: "toggle", id }); await get().refreshWorkers(); } catch { /* ignore */ }
  },

  enqueueJob: async (params) => {
    try {
      const r = await api.post<{ data: CloudJob }>("/cloud/jobs", params);
      await get().refreshJobs();
      void get().refreshMetrics();
      void get().refreshLogs();
      return r.data;
    } catch { return null; }
  },
  cancelJob: async (jobId) => {
    try { await api.post("/cloud/cancel", { jobId }); await get().refreshJobs(); } catch { /* ignore */ }
  },

  queueBuild: async (target, mode) => {
    try {
      const r = await api.post<{ data: BuildFarmJob }>("/cloud/build", { target, mode });
      await get().refreshBuilds();
      void get().refreshJobs();
      void get().refreshMetrics();
      void get().refreshArtifacts();
      void get().refreshLogs();
      return r.data;
    } catch { return null; }
  },
  submitRun: async (deviceId) => {
    try {
      const r = await api.post<{ data: CloudJob }>("/cloud/run", { deviceId });
      await get().refreshJobs();
      void get().refreshMetrics();
      void get().refreshLogs();
      return r.data;
    } catch { return null; }
  },
  submitTest: async () => {
    try {
      const r = await api.post<{ data: CloudJob }>("/cloud/test");
      await get().refreshJobs();
      void get().refreshMetrics();
      void get().refreshLogs();
      return r.data;
    } catch { return null; }
  },

  reserveDevice: async (deviceId) => {
    try { await api.post("/cloud/device-farm", { action: "reserve", deviceId, reservedBy: "user" }); await get().refreshDevices(); } catch { /* ignore */ }
  },
  releaseDevice: async (deviceId) => {
    try { await api.post("/cloud/device-farm", { action: "release", deviceId }); await get().refreshDevices(); } catch { /* ignore */ }
  },
  deleteArtifact: async (id) => {
    try { await api.delete(`/cloud/artifacts?id=${id}`); await get().refreshArtifacts(); } catch { /* ignore */ }
  },
  clearLogs: async () => {
    try { await api.delete("/cloud/logs"); await get().refreshLogs(); } catch { /* ignore */ }
  },
}));
