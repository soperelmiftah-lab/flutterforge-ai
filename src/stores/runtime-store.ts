"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  DeviceInfo, EmulatorInfo, RunSession, BuildJob, BuildConfig,
  BuildTarget, BuildMode, LogEntry, LogLevel,
  RuntimeHistoryEntry, RuntimeMetrics, SdkInfo, EnvironmentInfo,
  DoctorResult, AnalyzeResult, TestResult, PubResult, PubCommand,
  HotReloadResult, ProcessInfo,
} from "@/features/flutter-runtime/types";

/**
 * Runtime Store — top-level store for the Flutter Runtime Platform. Holds
 * device registry, run sessions, build jobs, logs, history, and metrics.
 */
interface RuntimeStoreState {
  sdk: SdkInfo | null;
  environment: EnvironmentInfo | null;
  doctor: DoctorResult | null;
  devices: DeviceInfo[];
  emulators: EmulatorInfo[];
  sessions: RunSession[];
  activeSession: RunSession | null;
  buildJobs: BuildJob[];
  logs: LogEntry[];
  logStats: Record<LogLevel, number> | null;
  history: RuntimeHistoryEntry[];
  metrics: RuntimeMetrics | null;
  processes: ProcessInfo[];
  loading: boolean;
  error: string | null;

  // Run/build state
  building: boolean;
  running: boolean;

  // Actions
  hydrate: () => Promise<void>;
  refreshDevices: () => Promise<void>;
  refreshEmulators: () => Promise<void>;
  refreshLogs: () => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshBuildJobs: () => Promise<void>;
  refreshProcesses: () => Promise<void>;
  runDoctor: () => Promise<void>;

  startRun: (deviceId: string) => Promise<RunSession | null>;
  stopSession: (sessionId: string) => Promise<void>;
  hotReload: (sessionId?: string) => Promise<HotReloadResult | null>;
  hotRestart: (sessionId?: string) => Promise<HotReloadResult | null>;

  startBuild: (target: BuildTarget, mode: BuildMode) => Promise<BuildJob | null>;

  startEmulator: (emulatorId: string) => Promise<void>;
  stopEmulator: (emulatorId: string) => Promise<void>;
  attachDevice: (params: { name: string; platform: DeviceInfo["platform"]; isEmulator?: boolean }) => Promise<void>;
  detachDevice: (deviceId: string) => Promise<void>;
  killProcess: (pid: number) => Promise<void>;

  runAnalyze: () => Promise<AnalyzeResult | null>;
  runTest: (type?: TestResult["type"]) => Promise<TestResult | null>;
  runPub: (command: PubCommand) => Promise<PubResult | null>;

  clearLogs: () => Promise<void>;
}

export const useRuntimeStore = create<RuntimeStoreState>((set, get) => ({
  sdk: null,
  environment: null,
  doctor: null,
  devices: [],
  emulators: [],
  sessions: [],
  activeSession: null,
  buildJobs: [],
  logs: [],
  logStats: null,
  history: [],
  metrics: null,
  processes: [],
  loading: false,
  error: null,
  building: false,
  running: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const [sdkRes, envRes, docRes, devRes, emuRes, logsRes, histRes, metRes, sessRes, buildRes, procRes] = await Promise.all([
        api.get<{ data: SdkInfo[]; current: SdkInfo }>("/runtime/sdk"),
        api.get<{ data: EnvironmentInfo }>("/runtime/environment"),
        api.get<{ data: DoctorResult }>("/runtime/doctor"),
        api.get<{ data: DeviceInfo[] }>("/runtime/devices"),
        api.get<{ data: EmulatorInfo[] }>("/runtime/emulators"),
        api.get<{ data: LogEntry[]; stats: Record<LogLevel, number> }>("/runtime/logs"),
        api.get<{ data: RuntimeHistoryEntry[] }>("/runtime/history"),
        api.get<{ data: RuntimeMetrics }>("/runtime/metrics"),
        api.get<{ data: any[] }>("/runtime/sessions"),
        api.get<{ data: BuildJob[] }>("/runtime/build"),
        api.get<{ data: ProcessInfo[] }>("/runtime/processes"),
      ]);
      set({
        sdk: sdkRes.current,
        environment: envRes.data,
        doctor: docRes.data,
        devices: devRes.data ?? [],
        emulators: emuRes.data ?? [],
        logs: logsRes.data ?? [],
        logStats: logsRes.stats,
        history: histRes.data ?? [],
        metrics: metRes.data,
        sessions: (sessRes.data ?? []).map((s: any) => s.runSession).filter(Boolean),
        activeSession: (sessRes.data ?? []).find((s: any) => s.status === "active")?.runSession ?? null,
        buildJobs: buildRes.data ?? [],
        processes: procRes.data ?? [],
        loading: false,
      });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Hydration failed" });
    }
  },

  refreshDevices: async () => {
    try {
      const res = await api.get<{ data: DeviceInfo[] }>("/runtime/devices");
      set({ devices: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshEmulators: async () => {
    try {
      const res = await api.get<{ data: EmulatorInfo[] }>("/runtime/emulators");
      set({ emulators: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshLogs: async () => {
    try {
      const res = await api.get<{ data: LogEntry[]; stats: Record<LogLevel, number> }>("/runtime/logs?limit=200");
      set({ logs: res.data ?? [], logStats: res.stats });
    } catch { /* ignore */ }
  },
  refreshHistory: async () => {
    try {
      const res = await api.get<{ data: RuntimeHistoryEntry[] }>("/runtime/history");
      set({ history: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshMetrics: async () => {
    try {
      const res = await api.get<{ data: RuntimeMetrics }>("/runtime/metrics");
      set({ metrics: res.data });
    } catch { /* ignore */ }
  },
  refreshSessions: async () => {
    try {
      const res = await api.get<{ data: any[] }>("/runtime/sessions");
      const sessions = (res.data ?? []).map((s: any) => s.runSession).filter(Boolean);
      set({
        sessions,
        activeSession: (res.data ?? []).find((s: any) => s.status === "active")?.runSession ?? null,
      });
    } catch { /* ignore */ }
  },
  refreshBuildJobs: async () => {
    try {
      const res = await api.get<{ data: BuildJob[] }>("/runtime/build");
      set({ buildJobs: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshProcesses: async () => {
    try {
      const res = await api.get<{ data: ProcessInfo[] }>("/runtime/processes");
      set({ processes: res.data ?? [] });
    } catch { /* ignore */ }
  },
  runDoctor: async () => {
    try {
      const res = await api.get<{ data: DoctorResult }>("/runtime/doctor");
      set({ doctor: res.data });
    } catch { /* ignore */ }
  },

  startRun: async (deviceId: string) => {
    set({ running: true, error: null });
    try {
      const res = await api.post<{ data: RunSession }>("/runtime/run", { deviceId });
      const session = res.data;
      set({
        activeSession: session,
        sessions: [session, ...get().sessions.filter((s) => s.id !== session.id)],
        running: false,
      });
      void get().refreshProcesses();
      void get().refreshLogs();
      return session;
    } catch (e: unknown) {
      set({ running: false, error: e instanceof Error ? e.message : "Run failed" });
      return null;
    }
  },

  stopSession: async (sessionId: string) => {
    try {
      await api.post("/runtime/stop", { sessionId });
      set({
        activeSession: get().activeSession?.id === sessionId ? null : get().activeSession,
        sessions: get().sessions.map((s) => s.id === sessionId ? { ...s, status: "stopped" } : s),
      });
      void get().refreshProcesses();
    } catch { /* ignore */ }
  },

  hotReload: async (sessionId?: string) => {
    const id = sessionId ?? get().activeSession?.id;
    if (!id) return null;
    try {
      const url = sessionId ? `/runtime/hotreload?sessionId=${sessionId}` : "/runtime/hotreload";
      const res = await api.post<{ data: HotReloadResult }>(url);
      // Update the active session's hot reload count locally.
      set({
        sessions: get().sessions.map((s) =>
          s.id === id ? { ...s, hotReloadCount: s.hotReloadCount + 1 } : s
        ),
        activeSession: get().activeSession?.id === id
          ? { ...get().activeSession!, hotReloadCount: get().activeSession!.hotReloadCount + 1 }
          : get().activeSession,
      });
      void get().refreshLogs();
      return res.data;
    } catch { return null; }
  },

  hotRestart: async (sessionId?: string) => {
    const id = sessionId ?? get().activeSession?.id;
    if (!id) return null;
    try {
      const url = sessionId ? `/runtime/hotrestart?sessionId=${sessionId}` : "/runtime/hotrestart";
      const res = await api.post<{ data: HotReloadResult }>(url);
      set({
        sessions: get().sessions.map((s) =>
          s.id === id ? { ...s, hotRestartCount: s.hotRestartCount + 1 } : s
        ),
        activeSession: get().activeSession?.id === id
          ? { ...get().activeSession!, hotRestartCount: get().activeSession!.hotRestartCount + 1 }
          : get().activeSession,
      });
      void get().refreshLogs();
      return res.data;
    } catch { return null; }
  },

  startBuild: async (target: BuildTarget, mode: BuildMode) => {
    set({ building: true, error: null });
    try {
      const res = await api.post<{ data: BuildJob }>("/runtime/build", { target, mode });
      const job = res.data;
      set({
        buildJobs: [job, ...get().buildJobs.filter((j) => j.id !== job.id)],
        building: false,
      });
      void get().refreshLogs();
      void get().refreshMetrics();
      return job;
    } catch (e: unknown) {
      set({ building: false, error: e instanceof Error ? e.message : "Build failed" });
      return null;
    }
  },

  startEmulator: async (emulatorId: string) => {
    try {
      await api.post("/runtime/emulator/start", { emulatorId });
      void get().refreshEmulators();
      void get().refreshDevices();
    } catch { /* ignore */ }
  },
  stopEmulator: async (emulatorId: string) => {
    try {
      await api.post("/runtime/emulator/stop", { emulatorId });
      void get().refreshEmulators();
      void get().refreshDevices();
    } catch { /* ignore */ }
  },
  attachDevice: async (params) => {
    try {
      await api.post("/runtime/device/attach", params);
      void get().refreshDevices();
    } catch { /* ignore */ }
  },
  detachDevice: async (deviceId: string) => {
    try {
      await api.post("/runtime/device/detach", { deviceId });
      void get().refreshDevices();
    } catch { /* ignore */ }
  },
  killProcess: async (pid: number) => {
    try {
      await api.post("/runtime/processes/kill", { pid });
      void get().refreshProcesses();
      void get().refreshSessions();
    } catch { /* ignore */ }
  },

  runAnalyze: async () => {
    try {
      const res = await api.post<{ data: AnalyzeResult }>("/runtime/analyze");
      void get().refreshLogs();
      void get().refreshMetrics();
      void get().refreshHistory();
      return res.data;
    } catch { return null; }
  },
  runTest: async (type = "unit") => {
    try {
      const res = await api.post<{ data: TestResult }>("/runtime/test", { type });
      void get().refreshLogs();
      void get().refreshMetrics();
      void get().refreshHistory();
      return res.data;
    } catch { return null; }
  },
  runPub: async (command: PubCommand) => {
    try {
      const res = await api.post<{ data: PubResult }>("/runtime/pub", { command });
      void get().refreshLogs();
      void get().refreshMetrics();
      void get().refreshHistory();
      return res.data;
    } catch { return null; }
  },

  clearLogs: async () => {
    try {
      await api.delete("/runtime/logs");
      set({ logs: [] });
    } catch { /* ignore */ }
  },
}));
