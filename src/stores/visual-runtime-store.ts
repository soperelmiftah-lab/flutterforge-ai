"use client";

import { create } from "zustand";
import { api } from "@/lib/api";
import type {
  BridgeDevice, Screenshot, ScreenStream, VisualSession,
  VisualEvent, EventType, ConsoleEntry, ConsoleLevel, ConsoleSource,
  FrameStats, PerformanceOverlay, LayoutReport, WidgetTree, RenderTree,
  VisionContext, VisualMetrics, Annotation, ComparisonResult,
} from "@/features/visual-runtime/types";

/**
 * Visual Runtime Store — top-level store for the Visual Runtime & Device
 * Bridge. Holds device registry, screenshots, streams, sessions, events,
 * console entries, frame stats, and metrics.
 */
interface VisualRuntimeState {
  devices: BridgeDevice[];
  connectedDevices: BridgeDevice[];
  screenshots: Screenshot[];
  streams: ScreenStream[];
  sessions: VisualSession[];
  activeSessions: VisualSession[];
  events: VisualEvent[];
  consoleEntries: ConsoleEntry[];
  consoleStats: Record<ConsoleLevel, number> | null;
  frameHistory: FrameStats[];
  latestFrame: FrameStats | null;
  performance: PerformanceOverlay | null;
  widgetTree: WidgetTree | null;
  layoutReport: LayoutReport | null;
  renderTree: RenderTree | null;
  visionContext: VisionContext | null;
  metrics: VisualMetrics | null;
  annotations: Annotation[];
  loading: boolean;
  error: string | null;

  // Selected device (for preview/inspect)
  selectedDeviceId: string | null;

  // Actions
  hydrate: () => Promise<void>;
  setSelectedDevice: (id: string) => void;

  refreshDevices: () => Promise<void>;
  refreshScreenshots: () => Promise<void>;
  refreshStreams: () => Promise<void>;
  refreshSessions: () => Promise<void>;
  refreshEvents: () => Promise<void>;
  refreshConsole: () => Promise<void>;
  refreshFrames: () => Promise<void>;
  refreshMetrics: () => Promise<void>;

  connectDevice: (deviceId: string) => Promise<boolean>;
  disconnectDevice: (deviceId: string) => Promise<boolean>;
  toggleOrientation: (deviceId: string) => Promise<void>;

  captureScreenshot: (deviceId: string) => Promise<Screenshot | null>;
  deleteScreenshot: (id: string) => Promise<void>;
  clearScreenshots: () => Promise<void>;

  startStream: (deviceId: string) => Promise<void>;
  stopStream: (deviceId: string) => Promise<void>;
  pauseStream: (deviceId: string) => Promise<void>;
  resumeStream: (deviceId: string) => Promise<void>;

  captureWidgetTree: () => Promise<void>;
  analyzeLayout: () => Promise<void>;
  captureRenderTree: () => Promise<void>;
  captureFrame: () => Promise<void>;
  resetJank: () => Promise<void>;
  capturePerformance: () => Promise<void>;
  buildVisionContext: (deviceId: string) => Promise<void>;

  simulate: (params: { type: EventType; [key: string]: unknown }) => Promise<void>;
  clearEvents: () => Promise<void>;
  clearConsole: () => Promise<void>;

  compareScreenshots: (aId: string, bId: string) => Promise<ComparisonResult | null>;
}

export const useVisualRuntimeStore = create<VisualRuntimeState>((set, get) => ({
  devices: [],
  connectedDevices: [],
  screenshots: [],
  streams: [],
  sessions: [],
  activeSessions: [],
  events: [],
  consoleEntries: [],
  consoleStats: null,
  frameHistory: [],
  latestFrame: null,
  performance: null,
  widgetTree: null,
  layoutReport: null,
  renderTree: null,
  visionContext: null,
  metrics: null,
  annotations: [],
  loading: false,
  error: null,
  selectedDeviceId: null,

  hydrate: async () => {
    set({ loading: true });
    try {
      const [devRes, shotsRes, streamsRes, sessRes, evtRes, conRes, frameRes, metRes] = await Promise.all([
        api.get<{ data: BridgeDevice[]; connected: number }>("/visual/devices"),
        api.get<{ data: Screenshot[] }>("/visual/screenshots"),
        api.get<{ data: ScreenStream[] }>("/visual/stream"),
        api.get<{ data: VisualSession[]; active: VisualSession[] }>("/visual/sessions"),
        api.get<{ data: VisualEvent[] }>("/visual/events?limit=50"),
        api.get<{ data: ConsoleEntry[]; stats: Record<ConsoleLevel, number> }>("/visual/console?limit=100"),
        api.get<{ data: FrameStats[]; latest: FrameStats | null }>("/visual/frames"),
        api.get<{ data: VisualMetrics }>("/visual/metrics"),
      ]);
      set({
        devices: devRes.data ?? [],
        connectedDevices: (devRes.data ?? []).filter((d) => d.isConnected),
        screenshots: shotsRes.data ?? [],
        streams: streamsRes.data ?? [],
        sessions: sessRes.data ?? [],
        activeSessions: sessRes.active ?? [],
        events: evtRes.data ?? [],
        consoleEntries: conRes.data ?? [],
        consoleStats: conRes.stats,
        frameHistory: frameRes.data ?? [],
        latestFrame: frameRes.latest,
        metrics: metRes.data,
        loading: false,
        selectedDeviceId: get().selectedDeviceId ?? (devRes.data ?? []).find((d) => d.isConnected)?.id ?? null,
      });
    } catch (e: unknown) {
      set({ loading: false, error: e instanceof Error ? e.message : "Hydration failed" });
    }
  },

  setSelectedDevice: (id) => set({ selectedDeviceId: id }),

  refreshDevices: async () => {
    try {
      const res = await api.get<{ data: BridgeDevice[]; connected: number }>("/visual/devices");
      set({ devices: res.data ?? [], connectedDevices: (res.data ?? []).filter((d) => d.isConnected) });
    } catch { /* ignore */ }
  },
  refreshScreenshots: async () => {
    try {
      const res = await api.get<{ data: Screenshot[] }>("/visual/screenshots");
      set({ screenshots: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshStreams: async () => {
    try {
      const res = await api.get<{ data: ScreenStream[] }>("/visual/stream");
      set({ streams: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshSessions: async () => {
    try {
      const res = await api.get<{ data: VisualSession[]; active: VisualSession[] }>("/visual/sessions");
      set({ sessions: res.data ?? [], activeSessions: res.active ?? [] });
    } catch { /* ignore */ }
  },
  refreshEvents: async () => {
    try {
      const res = await api.get<{ data: VisualEvent[] }>("/visual/events?limit=50");
      set({ events: res.data ?? [] });
    } catch { /* ignore */ }
  },
  refreshConsole: async () => {
    try {
      const res = await api.get<{ data: ConsoleEntry[]; stats: Record<ConsoleLevel, number> }>("/visual/console?limit=100");
      set({ consoleEntries: res.data ?? [], consoleStats: res.stats });
    } catch { /* ignore */ }
  },
  refreshFrames: async () => {
    try {
      const res = await api.get<{ data: FrameStats[]; latest: FrameStats | null }>("/visual/frames");
      set({ frameHistory: res.data ?? [], latestFrame: res.latest });
    } catch { /* ignore */ }
  },
  refreshMetrics: async () => {
    try {
      const res = await api.get<{ data: VisualMetrics }>("/visual/metrics");
      set({ metrics: res.data });
    } catch { /* ignore */ }
  },

  connectDevice: async (deviceId: string) => {
    try {
      await api.post("/visual/connect", { deviceId });
      await get().refreshDevices();
      await get().refreshSessions();
      return true;
    } catch { return false; }
  },
  disconnectDevice: async (deviceId: string) => {
    try {
      await api.post("/visual/disconnect", { deviceId });
      await get().refreshDevices();
      await get().refreshSessions();
      return true;
    } catch { return false; }
  },
  toggleOrientation: async (deviceId: string) => {
    try {
      await api.post("/visual/orientation", { deviceId });
      await get().refreshDevices();
    } catch { /* ignore */ }
  },

  captureScreenshot: async (deviceId: string) => {
    try {
      const res = await api.post<{ data: Screenshot }>("/visual/capture", { deviceId });
      await get().refreshScreenshots();
      await get().refreshMetrics();
      return res.data;
    } catch { return null; }
  },
  deleteScreenshot: async (id: string) => {
    // No per-id endpoint; use the screenshots list refresh after delete.
    // For simplicity, we just refresh — the actual delete would need a dedicated endpoint.
    void id;
    await get().refreshScreenshots();
  },
  clearScreenshots: async () => {
    try {
      await api.delete("/visual/screenshots");
      await get().refreshScreenshots();
    } catch { /* ignore */ }
  },

  startStream: async (deviceId: string) => {
    try {
      await api.post("/visual/stream", { deviceId, action: "start" });
      await get().refreshStreams();
    } catch { /* ignore */ }
  },
  stopStream: async (deviceId: string) => {
    try {
      await api.post("/visual/stream", { deviceId, action: "stop" });
      await get().refreshStreams();
    } catch { /* ignore */ }
  },
  pauseStream: async (deviceId: string) => {
    try {
      await api.post("/visual/stream", { deviceId, action: "pause" });
      await get().refreshStreams();
    } catch { /* ignore */ }
  },
  resumeStream: async (deviceId: string) => {
    try {
      await api.post("/visual/stream", { deviceId, action: "resume" });
      await get().refreshStreams();
    } catch { /* ignore */ }
  },

  captureWidgetTree: async () => {
    try {
      const res = await api.get<{ data: WidgetTree }>("/visual/widget-tree");
      set({ widgetTree: res.data });
    } catch { /* ignore */ }
  },
  analyzeLayout: async () => {
    try {
      const res = await api.get<{ data: LayoutReport }>("/visual/layout");
      set({ layoutReport: res.data });
    } catch { /* ignore */ }
  },
  captureRenderTree: async () => {
    try {
      const res = await api.get<{ data: RenderTree }>("/visual/render-tree");
      set({ renderTree: res.data });
    } catch { /* ignore */ }
  },
  captureFrame: async () => {
    try {
      const res = await api.post<{ data: FrameStats }>("/visual/frames", { action: "capture" });
      set({ latestFrame: res.data });
      await get().refreshFrames();
    } catch { /* ignore */ }
  },
  resetJank: async () => {
    try {
      await api.post("/visual/frames", { action: "reset" });
      await get().refreshFrames();
    } catch { /* ignore */ }
  },
  capturePerformance: async () => {
    try {
      const res = await api.get<{ data: PerformanceOverlay }>("/visual/performance");
      set({ performance: res.data });
    } catch { /* ignore */ }
  },
  buildVisionContext: async (deviceId: string) => {
    try {
      const res = await api.get<{ data: VisionContext }>(`/visual/vision?deviceId=${deviceId}`);
      set({ visionContext: res.data });
    } catch { /* ignore */ }
  },

  simulate: async (params) => {
    try {
      await api.post("/visual/simulate", params);
      await get().refreshEvents();
    } catch { /* ignore */ }
  },
  clearEvents: async () => {
    try {
      await api.delete("/visual/events");
      await get().refreshEvents();
    } catch { /* ignore */ }
  },
  clearConsole: async () => {
    try {
      await api.delete("/visual/console");
      await get().refreshConsole();
    } catch { /* ignore */ }
  },

  compareScreenshots: async (aId: string, bId: string) => {
    try {
      const res = await api.post<{ data: ComparisonResult }>("/visual/compare", {
        screenshotAId: aId, screenshotBId: bId,
      });
      return res.data;
    } catch { return null; }
  },
}));
