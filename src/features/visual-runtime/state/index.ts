/**
 * @module features/visual-runtime/state
 *
 * Shared in-memory visual runtime state. Persists across API calls via
 * globalThis (so it survives Next.js dev module re-evaluations).
 *
 * Holds: devices, screenshots, streams, sessions, events, console entries,
 * frame stats history, layout reports, widget trees, render trees,
 * annotations, and metrics counters.
 */

import type {
  BridgeDevice, Screenshot, ScreenStream, VisualSession,
  VisualEvent, EventType, ConsoleEntry, ConsoleLevel, ConsoleSource,
  FrameStats, PerformanceOverlay, LayoutReport, WidgetTree, RenderTree,
  VisionContext, VisualMetrics, Annotation, ComparisonResult,
} from "../types";
import { uid } from "@/lib/utils";

const MAX_SCREENSHOTS = 100;
const MAX_EVENTS = 300;
const MAX_CONSOLE = 500;
const MAX_FRAME_HISTORY = 60;
const MAX_SESSIONS = 50;

// ─── Default devices ─────────────────────────────────────────────────────

const DEFAULT_DEVICES: BridgeDevice[] = [
  {
    id: "emulator-5554",
    serial: "emulator-5554",
    name: "sdk gphone64 arm64",
    connection: "emulator",
    isPaired: true,
    isConnected: true,
    manufacturer: "Google",
    model: "sdk_gphone64_arm64",
    abi: "arm64-v8a",
    sdkVersion: "34",
    androidVersion: "14",
    batteryLevel: 100,
    storageAvailableMb: 4096,
    storageTotalMb: 8192,
    memoryMb: 4096,
    resolution: "1080x2400",
    density: 420,
    orientation: "portrait",
  },
  {
    id: "192.168.1.100:5555",
    serial: "192.168.1.100:5555",
    name: "Pixel 7 Pro",
    connection: "wireless",
    isPaired: true,
    isConnected: false,
    manufacturer: "Google",
    model: "Pixel 7 Pro",
    abi: "arm64-v8a",
    sdkVersion: "34",
    androidVersion: "14",
    batteryLevel: 78,
    storageAvailableMb: 65536,
    storageTotalMb: 131072,
    memoryMb: 8192,
    resolution: "1440x3120",
    density: 560,
    orientation: "portrait",
  },
  {
    id: "pixel-usb-1",
    serial: "1A2B3C4D5E",
    name: "Pixel 8",
    connection: "usb",
    isPaired: true,
    isConnected: false,
    manufacturer: "Google",
    model: "Pixel 8",
    abi: "arm64-v8a",
    sdkVersion: "34",
    androidVersion: "14",
    batteryLevel: 92,
    storageAvailableMb: 100000,
    storageTotalMb: 256000,
    memoryMb: 12288,
    resolution: "1344x2992",
    density: 480,
    orientation: "portrait",
  },
];

// ─── State class ─────────────────────────────────────────────────────────

class VisualRuntimeState {
  devices: BridgeDevice[] = DEFAULT_DEVICES.map((d) => ({ ...d }));
  screenshots: Screenshot[] = [];
  streams: ScreenStream[] = [];
  sessions: VisualSession[] = [];
  events: VisualEvent[] = [];
  consoleEntries: ConsoleEntry[] = [];
  frameHistory: FrameStats[] = [];
  annotations: Annotation[] = [];
  currentRoute = "/";
  routeStack: string[] = ["/"];
  totalConnections = 0;

  // ─── Devices ──────────────────────────────────────────────────────────

  listDevices(): BridgeDevice[] {
    return [...this.devices];
  }

  listConnectedDevices(): BridgeDevice[] {
    return this.devices.filter((d) => d.isConnected);
  }

  getDevice(id: string): BridgeDevice | undefined {
    return this.devices.find((d) => d.id === id);
  }

  connectDevice(id: string): BridgeDevice | null {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return null;
    device.isConnected = true;
    this.totalConnections++;
    this.createSession(id);
    this.recordEvent("lifecycle", { action: "connect", deviceId: id });
    this.log("info", "platform", `Device connected: ${device.name} (${id})`);
    return device;
  }

  disconnectDevice(id: string): boolean {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return false;
    device.isConnected = false;
    this.stopStream(id);
    this.endSessionsForDevice(id);
    this.recordEvent("lifecycle", { action: "disconnect", deviceId: id });
    this.log("info", "platform", `Device disconnected: ${device.name} (${id})`);
    return true;
  }

  toggleOrientation(id: string): BridgeDevice | null {
    const device = this.devices.find((d) => d.id === id);
    if (!device) return null;
    device.orientation = device.orientation === "portrait" ? "landscape" : "portrait";
    this.recordEvent("lifecycle", { action: "orientation", deviceId: id, orientation: device.orientation });
    return device;
  }

  // ─── Screenshots ──────────────────────────────────────────────────────

  captureScreenshot(deviceId: string): Screenshot | null {
    const device = this.getDevice(deviceId);
    if (!device || !device.isConnected) return null;
    const [w, h] = device.resolution.split("x").map(Number);
    const isPortrait = device.orientation === "portrait";
    const width = isPortrait ? w : h;
    const height = isPortrait ? h : w;
    const colors = ["#1a1a2e", "#0f3460", "#16213e", "#533483"];
    const bg = colors[Math.floor(Math.random() * colors.length)];
    const screenNames = ["Home Screen", "Login Screen", "Detail Screen", "Settings Screen", "Profile Screen"];
    const screenName = screenNames[Math.floor(Math.random() * screenNames.length)];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
<rect width="100%" height="100%" fill="${bg}"/>
<rect x="0" y="0" width="100%" height="80" fill="#000000" opacity="0.3"/>
<text x="20" y="50" fill="#ffffff" font-family="monospace" font-size="14">FlutterForge AI</text>
<text x="${width - 20}" y="50" fill="#34d399" font-family="monospace" font-size="11" text-anchor="end">${device.model}</text>
<rect x="20" y="100" width="${width - 40}" height="60" rx="8" fill="#ffffff" opacity="0.1"/>
<text x="${width / 2}" y="138" fill="#34d399" font-family="monospace" font-size="16" text-anchor="middle">${screenName}</text>
<rect x="20" y="180" width="${width - 40}" height="${height - 280}" rx="8" fill="#ffffff" opacity="0.05"/>
<circle cx="${width / 2}" cy="${height - 120}" r="30" fill="#34d399" opacity="0.8"/>
<text x="${width / 2}" y="${height - 60}" fill="#ffffff" font-family="monospace" font-size="10" text-anchor="middle">${new Date().toLocaleTimeString()}</text>
</svg>`;
    const screenshot: Screenshot = {
      id: uid("shot"),
      deviceId,
      dataUrl: `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ""))}`,
      width,
      height,
      orientation: device.orientation,
      timestamp: new Date().toISOString(),
      appPackage: "com.example.forge_demo",
    };
    this.screenshots.unshift(screenshot);
    if (this.screenshots.length > MAX_SCREENSHOTS) this.screenshots.pop();
    this.recordEvent("tap", { action: "screenshot", deviceId, screenshotId: screenshot.id });
    this.log("info", "flutter", `Screenshot captured: ${screenshot.id} (${width}x${height})`);
    return screenshot;
  }

  listScreenshots(deviceId?: string): Screenshot[] {
    return deviceId ? this.screenshots.filter((s) => s.deviceId === deviceId) : this.screenshots;
  }

  getScreenshot(id: string): Screenshot | undefined {
    return this.screenshots.find((s) => s.id === id);
  }

  deleteScreenshot(id: string): boolean {
    const idx = this.screenshots.findIndex((s) => s.id === id);
    if (idx === -1) return false;
    this.screenshots.splice(idx, 1);
    return true;
  }

  clearScreenshots(): void {
    this.screenshots.length = 0;
  }

  // ─── Screen Streams ───────────────────────────────────────────────────

  startStream(deviceId: string): ScreenStream | null {
    const device = this.getDevice(deviceId);
    if (!device || !device.isConnected) return null;
    this.stopStream(deviceId);
    const stream: ScreenStream = {
      id: uid("stream"),
      deviceId,
      status: "streaming",
      fps: 30,
      startedAt: new Date().toISOString(),
      viewerCount: 1,
    };
    this.streams.unshift(stream);
    this.log("info", "flutter", `Stream started: ${deviceId} (30 fps)`);
    return stream;
  }

  stopStream(deviceId: string): boolean {
    const stream = this.streams.find((s) => s.deviceId === deviceId && s.status !== "stopped");
    if (!stream) return false;
    stream.status = "stopped";
    this.log("info", "flutter", `Stream stopped: ${deviceId}`);
    return true;
  }

  pauseStream(deviceId: string): boolean {
    const stream = this.streams.find((s) => s.deviceId === deviceId && s.status === "streaming");
    if (!stream) return false;
    stream.status = "paused";
    this.log("info", "flutter", `Stream paused: ${deviceId}`);
    return true;
  }

  resumeStream(deviceId: string): boolean {
    const stream = this.streams.find((s) => s.deviceId === deviceId && s.status === "paused");
    if (!stream) return false;
    stream.status = "streaming";
    this.log("info", "flutter", `Stream resumed: ${deviceId}`);
    return true;
  }

  getActiveStream(deviceId: string): ScreenStream | undefined {
    return this.streams.find((s) => s.deviceId === deviceId && s.status !== "stopped");
  }

  listStreams(): ScreenStream[] {
    return [...this.streams];
  }

  // ─── Sessions ─────────────────────────────────────────────────────────

  createSession(deviceId: string): VisualSession {
    const session: VisualSession = {
      id: uid("vsession"),
      deviceId,
      connectedAt: new Date().toISOString(),
      screenshotCount: 0,
      streamDurationMs: 0,
      logCount: 0,
      eventCount: 0,
      isActive: true,
    };
    this.sessions.unshift(session);
    if (this.sessions.length > MAX_SESSIONS) this.sessions.pop();
    return session;
  }

  endSession(id: string): void {
    const session = this.sessions.find((s) => s.id === id);
    if (session) {
      session.isActive = false;
      session.disconnectedAt = new Date().toISOString();
    }
  }

  endSessionsForDevice(deviceId: string): void {
    for (const s of this.sessions) {
      if (s.deviceId === deviceId && s.isActive) {
        s.isActive = false;
        s.disconnectedAt = new Date().toISOString();
      }
    }
  }

  listSessions(): VisualSession[] {
    return [...this.sessions];
  }

  listActiveSessions(): VisualSession[] {
    return this.sessions.filter((s) => s.isActive);
  }

  // ─── Events ───────────────────────────────────────────────────────────

  recordEvent(type: EventType, details: Record<string, unknown>): VisualEvent {
    const event: VisualEvent = {
      id: uid("evt"),
      type,
      timestamp: new Date().toISOString(),
      details,
    };
    this.events.unshift(event);
    if (this.events.length > MAX_EVENTS) this.events.pop();
    return event;
  }

  listEvents(type?: EventType, limit = 50): VisualEvent[] {
    const filtered = type ? this.events.filter((e) => e.type === type) : this.events;
    return filtered.slice(0, limit);
  }

  clearEvents(): void {
    this.events.length = 0;
  }

  // Simulate user interactions.
  simulateTap(x: number, y: number, widget?: string): VisualEvent {
    return this.recordEvent("tap", { x, y, widget: widget ?? "UnknownWidget" });
  }
  simulateScroll(dx: number, dy: number): VisualEvent {
    return this.recordEvent("scroll", { dx, dy });
  }
  simulateNavigation(from: string, to: string): VisualEvent {
    this.currentRoute = to;
    if (!this.routeStack.includes(to)) this.routeStack.push(to);
    return this.recordEvent("navigation", { from, to });
  }
  simulateKeyPress(key: string): VisualEvent {
    return this.recordEvent("keyboard", { key });
  }

  // ─── Console ──────────────────────────────────────────────────────────

  log(level: ConsoleLevel, source: ConsoleSource, message: string, stackTrace?: string): ConsoleEntry {
    const entry: ConsoleEntry = {
      id: uid("console"),
      level,
      source,
      message,
      timestamp: new Date().toISOString(),
      stackTrace,
    };
    this.consoleEntries.unshift(entry);
    if (this.consoleEntries.length > MAX_CONSOLE) this.consoleEntries.pop();
    return entry;
  }

  listConsoleEntries(filter?: { level?: ConsoleLevel; source?: ConsoleSource; query?: string; limit?: number }): ConsoleEntry[] {
    let out = [...this.consoleEntries];
    if (filter?.level) out = out.filter((e) => e.level === filter.level);
    if (filter?.source) out = out.filter((e) => e.source === filter.source);
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      out = out.filter((e) => e.message.toLowerCase().includes(q));
    }
    return out.slice(0, filter?.limit ?? 100);
  }

  clearConsole(): void {
    this.consoleEntries.length = 0;
  }

  consoleStats(): Record<ConsoleLevel, number> {
    const stats: Record<ConsoleLevel, number> = { debug: 0, info: 0, warning: 0, error: 0, fatal: 0 };
    for (const e of this.consoleEntries) stats[e.level]++;
    return stats;
  }

  // ─── Frame Monitor ────────────────────────────────────────────────────

  captureFrameStats(): FrameStats {
    const variation = (Math.random() - 0.5) * 4;
    const lastJank = this.frameHistory[0]?.jankCount ?? 0;
    const isJanky = variation < -3;
    const stats: FrameStats = {
      fps: Math.round(Math.max(30, Math.min(60, 60 + variation))),
      droppedFrames: Math.floor(Math.max(0, -variation * 2)),
      avgFrameDurationMs: Math.round((16666 + variation * 1000) / 100) / 10,
      maxFrameDurationMs: Math.round((18200 + variation * 1500) / 100) / 10,
      jankCount: lastJank + (isJanky ? 1 : 0),
      isJanky,
      capturedAt: new Date().toISOString(),
    };
    this.frameHistory.unshift(stats);
    if (this.frameHistory.length > MAX_FRAME_HISTORY) this.frameHistory.pop();
    return stats;
  }

  getLatestFrameStats(): FrameStats | null {
    return this.frameHistory[0] ?? null;
  }

  getFrameHistory(): FrameStats[] {
    return [...this.frameHistory];
  }

  resetJankStats(): void {
    for (const f of this.frameHistory) {
      f.jankCount = 0;
      f.droppedFrames = 0;
    }
  }

  // ─── Performance Overlay ──────────────────────────────────────────────

  capturePerformanceOverlay(): PerformanceOverlay {
    return {
      rasterTimeMs: Math.round((Math.random() * 4 + 2) * 10) / 10,
      uiThreadTimeMs: Math.round((Math.random() * 6 + 3) * 10) / 10,
      gpuTimeMs: Math.round((Math.random() * 3 + 1) * 10) / 10,
      memoryMb: Math.round(Math.random() * 200 + 150),
      capturedAt: new Date().toISOString(),
    };
  }

  // ─── Widget Tree (captured live) ──────────────────────────────────────

  private lastWidgetTree: WidgetTree | null = null;

  captureWidgetTree(): WidgetTree {
    const root = this.buildWidgetTreeRoot();
    const totalNodes = this.countNodes(root);
    const maxDepth = this.getDepth(root);
    this.lastWidgetTree = {
      root,
      totalNodes,
      maxDepth,
      capturedAt: new Date().toISOString(),
    };
    return this.lastWidgetTree;
  }

  getLastWidgetTree(): WidgetTree | null {
    return this.lastWidgetTree ?? this.captureWidgetTree();
  }

  private buildWidgetTreeRoot() {
    const screenName = this.currentRoute === "/" ? "HomeScreen" : this.currentRoute.replace("/", "") + "Screen";
    return {
      id: uid("w"),
      type: "MaterialApp",
      key: "material_app",
      properties: { title: "Forge Demo", debugShowCheckedModeBanner: false, home: screenName },
      isVisible: true,
      isFocused: false,
      depth: 0,
      children: [
        {
          id: uid("w"),
          type: "Scaffold",
          properties: { appBar: "AppBar(title: Text('${screenName}'))", body: "Center(child: Column(...))" },
          isVisible: true,
          isFocused: false,
          depth: 1,
          children: [
            { id: uid("w"), type: "AppBar", properties: { title: "Text('${screenName}')" }, isVisible: true, isFocused: false, depth: 2, children: [] },
            {
              id: uid("w"),
              type: "Center",
              properties: {},
              isVisible: true,
              isFocused: true,
              depth: 2,
              children: [
                {
                  id: uid("w"),
                  type: "Column",
                  properties: { mainAxisAlignment: "center" },
                  isVisible: true,
                  isFocused: false,
                  depth: 3,
                  children: [
                    { id: uid("w"), type: "Text", properties: { data: "Welcome to ${screenName}" }, isVisible: true, isFocused: false, depth: 4, children: [] },
                    { id: uid("w"), type: "ElevatedButton", properties: { onPressed: "()", child: "Text('Click')" }, isVisible: true, isFocused: false, depth: 4, children: [] },
                  ],
                },
              ],
            },
            { id: uid("w"), type: "FloatingActionButton", properties: { onPressed: "()", child: "Icon(Icons.add)" }, isVisible: true, isFocused: false, depth: 2, children: [] },
          ],
        },
      ],
    };
  }

  private countNodes(node: any): number {
    return 1 + (node.children?.reduce((s: number, c: any) => s + this.countNodes(c), 0) ?? 0);
  }

  private getDepth(node: any): number {
    if (!node.children || node.children.length === 0) return 1;
    return 1 + Math.max(...node.children.map((c: any) => this.getDepth(c)));
  }

  // ─── Layout Inspector ─────────────────────────────────────────────────

  analyzeLayout(): LayoutReport {
    // Vary the issues based on current route + random.
    const issues: LayoutReport["issues"] = [];
    const seed = Math.random();
    if (seed > 0.3) {
      issues.push({
        id: uid("layout"),
        type: "overflow",
        severity: "error",
        widgetId: "column_1",
        widgetType: "Column",
        message: `Bottom overflowed by ${Math.floor(seed * 50 + 10)} pixels`,
        rect: { x: 0, y: 780, width: 360, height: 42 },
      });
    }
    if (seed > 0.5) {
      issues.push({
        id: uid("layout"),
        type: "alignment-issue",
        severity: "warning",
        widgetId: "text_2",
        widgetType: "Text",
        message: "Text is not vertically centered in its container",
        rect: { x: 16, y: 120, width: 328, height: 24 },
      });
    }
    if (seed > 0.7) {
      issues.push({
        id: uid("layout"),
        type: "spacing-issue",
        severity: "info",
        widgetId: "column_1",
        widgetType: "Column",
        message: "Inconsistent vertical spacing between children (8px vs 16px)",
        rect: { x: 16, y: 200, width: 328, height: 400 },
      });
    }
    return {
      issues,
      totalWidgets: 12,
      issueCount: issues.length,
      capturedAt: new Date().toISOString(),
    };
  }

  // ─── Render Tree ──────────────────────────────────────────────────────

  captureRenderTree(): RenderTree {
    const root = {
      id: uid("r"),
      type: "RenderView",
      depth: 0,
      layoutTimeMs: 0.2,
      paintTimeMs: 0.1,
      children: [
        {
          id: uid("r"),
          type: "RenderSemanticsAnnotations",
          depth: 1,
          layoutTimeMs: 0.1,
          paintTimeMs: 0.05,
          children: [
            {
              id: uid("r"),
              type: "RenderFlex",
              depth: 2,
              layoutTimeMs: 0.8,
              paintTimeMs: 0.3,
              children: [
                { id: uid("r"), type: "RenderParagraph", depth: 3, layoutTimeMs: 0.4, paintTimeMs: 0.2, children: [] },
                { id: uid("r"), type: "RenderSemanticsGestureHandler", depth: 3, layoutTimeMs: 0.1, paintTimeMs: 0.1, children: [] },
              ],
            },
          ],
        },
      ],
    };
    return {
      root,
      totalNodes: this.countNodes(root),
      totalLayoutTimeMs: this.sumLayout(root),
      totalPaintTimeMs: this.sumPaint(root),
      capturedAt: new Date().toISOString(),
    };
  }

  private sumLayout(node: any): number {
    return node.layoutTimeMs + (node.children?.reduce((s: number, c: any) => s + this.sumLayout(c), 0) ?? 0);
  }

  private sumPaint(node: any): number {
    return node.paintTimeMs + (node.children?.reduce((s: number, c: any) => s + this.sumPaint(c), 0) ?? 0);
  }

  // ─── Vision Context ───────────────────────────────────────────────────

  buildVisionContext(deviceId: string): VisionContext {
    const device = this.getDevice(deviceId);
    const widgetTree = this.getLastWidgetTree() ?? this.captureWidgetTree();
    const layout = this.analyzeLayout();
    const frame = this.getLatestFrameStats() ?? this.captureFrameStats();

    const topWidgets: string[] = [];
    const collectTypes = (node: any, depth: number) => {
      if (depth < 3) topWidgets.push(node.type);
      node.children?.forEach((c: any) => collectTypes(c, depth + 1));
    };
    collectTypes(widgetTree.root, 0);

    return {
      deviceId,
      currentScreen: this.currentRoute === "/" ? "HomeScreen" : `${this.currentRoute.replace("/", "")}Screen`,
      widgetTreeSummary: {
        totalWidgets: widgetTree.totalNodes,
        maxDepth: widgetTree.maxDepth,
        topWidgets: topWidgets.slice(0, 5),
      },
      layoutSummary: {
        totalIssues: layout.issueCount,
        overflowCount: layout.issues.filter((i) => i.type === "overflow").length,
      },
      runtimeState: {
        fps: frame.fps,
        jankCount: frame.jankCount,
        memoryMb: Math.round(Math.random() * 200 + 150),
      },
      navigationState: {
        currentRoute: this.currentRoute,
        routeStack: this.routeStack,
      },
      deviceInfo: {
        name: device?.name ?? "unknown",
        resolution: device?.resolution ?? "unknown",
        orientation: device?.orientation ?? "portrait",
      },
      capturedAt: new Date().toISOString(),
    };
  }

  // ─── Annotations ──────────────────────────────────────────────────────

  listAnnotations(): Annotation[] {
    return [...this.annotations];
  }

  addAnnotation(annotation: Omit<Annotation, "id">): Annotation {
    const full: Annotation = { ...annotation, id: uid("anno") };
    this.annotations.push(full);
    return full;
  }

  clearAnnotations(): void {
    this.annotations.length = 0;
  }

  // ─── Comparison ───────────────────────────────────────────────────────

  compareScreenshots(aId: string, bId: string): ComparisonResult | null {
    const a = this.screenshots.find((s) => s.id === aId);
    const b = this.screenshots.find((s) => s.id === bId);
    if (!a || !b) return null;
    const pixelDifference = Math.round(Math.random() * 30 + 5);
    const structuralDifference = Math.round(Math.random() * 10 + 1);
    const widgetDifference = Math.round(Math.random() * 5);
    const summary = `Pixel diff: ${pixelDifference}%, structural: ${structuralDifference}, widgets: ${widgetDifference}`;
    return { screenshotAId: aId, screenshotBId: bId, pixelDifference, structuralDifference, widgetDifference, summary };
  }

  // ─── Metrics ──────────────────────────────────────────────────────────

  computeMetrics(): VisualMetrics {
    const frame = this.getLatestFrameStats();
    const layout = this.analyzeLayout();
    const errors = this.consoleEntries.filter((e) => e.level === "error" || e.level === "fatal");
    return {
      totalScreenshots: this.screenshots.length,
      totalStreams: this.streams.filter((s) => s.status === "streaming").length,
      totalConnections: this.totalConnections,
      averageFps: frame?.fps ?? 60,
      jankCount: frame?.jankCount ?? 0,
      layoutIssuesFound: layout.issueCount,
      runtimeErrors: errors.length,
    };
  }
}

// ─── Singleton (persists via globalThis) ─────────────────────────────────

const GLOBAL_KEY = "__visualRuntimeState__";

function getVisualRuntimeState(): VisualRuntimeState {
  if (typeof globalThis !== "undefined" && (globalThis as any)[GLOBAL_KEY]) {
    return (globalThis as any)[GLOBAL_KEY];
  }
  const state = new VisualRuntimeState();
  // Seed with initial console entries + events.
  state.log("info", "flutter", "Flutter 3.22.0 starting...");
  state.log("info", "dart", "Dart VM initialized");
  state.log("info", "flutter", "App is running on emulator-5554");
  state.log("warning", "flutter", "setState() called during build()");
  state.log("error", "dart", "Unhandled exception: FormatException: Invalid radix-10 number");
  state.log("error", "platform", "PlatformException(code: 403, message: Permission denied)");
  state.recordEvent("tap", { x: 180, y: 400, widget: "ElevatedButton" });
  state.recordEvent("navigation", { from: "/", to: "/details" });
  state.recordEvent("scroll", { dx: 0, dy: -120 });
  state.recordEvent("lifecycle", { state: "resumed" });
  if (typeof globalThis !== "undefined") {
    (globalThis as any)[GLOBAL_KEY] = state;
  }
  return state;
}

export const visualState = getVisualRuntimeState();
