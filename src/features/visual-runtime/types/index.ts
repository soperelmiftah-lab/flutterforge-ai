/**
 * @module features/visual-runtime/types
 *
 * Core domain types for the Visual Runtime & Android Device Bridge.
 */

// ─── Device Bridge ──────────────────────────────────────────────────────

export type BridgeConnection = "usb" | "wireless" | "emulator";

export interface BridgeDevice {
  id: string;
  serial: string;
  name: string;
  connection: BridgeConnection;
  isPaired: boolean;
  isConnected: boolean;
  manufacturer: string;
  model: string;
  abi: string;
  sdkVersion: string;
  androidVersion: string;
  batteryLevel: number;
  storageAvailableMb: number;
  storageTotalMb: number;
  memoryMb: number;
  resolution: string;
  density: number;
  orientation: "portrait" | "landscape";
}

export interface PairingCode {
  code: string;
  port: number;
  expiresAt: string;
}

// ─── Screenshots ────────────────────────────────────────────────────────

export interface Screenshot {
  id: string;
  deviceId: string;
  dataUrl: string;
  width: number;
  height: number;
  orientation: "portrait" | "landscape";
  timestamp: string;
  appPackage?: string;
}

// ─── Screen Stream ──────────────────────────────────────────────────────

export interface ScreenStream {
  id: string;
  deviceId: string;
  status: "idle" | "streaming" | "paused" | "stopped" | "error";
  fps: number;
  startedAt?: string;
  viewerCount: number;
}

// ─── Preview ────────────────────────────────────────────────────────────

export type PreviewTarget = "android" | "chrome" | "desktop";

export interface PreviewConfig {
  target: PreviewTarget;
  deviceId: string;
  zoom: number;
  orientation: "portrait" | "landscape";
  width: number;
  height: number;
}

// ─── Widget Inspector ───────────────────────────────────────────────────

export interface WidgetTreeNode {
  id: string;
  type: string;
  key?: string;
  properties: Record<string, unknown>;
  state?: Record<string, unknown>;
  children: WidgetTreeNode[];
  depth: number;
  isVisible: boolean;
  isFocused: boolean;
}

export interface WidgetTree {
  root: WidgetTreeNode;
  totalNodes: number;
  maxDepth: number;
  capturedAt: string;
}

// ─── Layout Inspector ───────────────────────────────────────────────────

export type LayoutIssueType =
  | "overflow"
  | "unbounded-constraints"
  | "clipping"
  | "alignment-issue"
  | "spacing-issue";

export interface LayoutIssue {
  id: string;
  type: LayoutIssueType;
  severity: "info" | "warning" | "error";
  widgetId: string;
  widgetType: string;
  message: string;
  rect: { x: number; y: number; width: number; height: number };
}

export interface LayoutReport {
  issues: LayoutIssue[];
  totalWidgets: number;
  issueCount: number;
  capturedAt: string;
}

// ─── Render Tree ────────────────────────────────────────────────────────

export interface RenderNode {
  id: string;
  type: string;
  depth: number;
  layoutTimeMs: number;
  paintTimeMs: number;
  children: RenderNode[];
}

export interface RenderTree {
  root: RenderNode;
  totalNodes: number;
  totalLayoutTimeMs: number;
  totalPaintTimeMs: number;
  capturedAt: string;
}

// ─── Frame Monitor ──────────────────────────────────────────────────────

export interface FrameStats {
  fps: number;
  droppedFrames: number;
  avgFrameDurationMs: number;
  maxFrameDurationMs: number;
  jankCount: number;
  isJanky: boolean;
  capturedAt: string;
}

// ─── Performance Overlay ────────────────────────────────────────────────

export interface PerformanceOverlay {
  rasterTimeMs: number;
  uiThreadTimeMs: number;
  gpuTimeMs: number;
  memoryMb: number;
  capturedAt: string;
}

// ─── Console Stream ─────────────────────────────────────────────────────

export type ConsoleLevel = "debug" | "info" | "warning" | "error" | "fatal";
export type ConsoleSource = "flutter" | "dart" | "platform" | "gradle";

export interface ConsoleEntry {
  id: string;
  level: ConsoleLevel;
  source: ConsoleSource;
  message: string;
  timestamp: string;
  stackTrace?: string;
}

// ─── Events ─────────────────────────────────────────────────────────────

export type EventType = "tap" | "long-press" | "scroll" | "navigation" | "keyboard" | "lifecycle";

export interface VisualEvent {
  id: string;
  type: EventType;
  timestamp: string;
  details: Record<string, unknown>;
}

// ─── Vision Context ─────────────────────────────────────────────────────

export interface VisionContext {
  deviceId: string;
  currentScreen: string;
  widgetTreeSummary: { totalWidgets: number; maxDepth: number; topWidgets: string[] };
  layoutSummary: { totalIssues: number; overflowCount: number };
  runtimeState: { fps: number; jankCount: number; memoryMb: number };
  navigationState: { currentRoute: string; routeStack: string[] };
  deviceInfo: { name: string; resolution: string; orientation: string };
  capturedAt: string;
}

// ─── Comparison ─────────────────────────────────────────────────────────

export interface ComparisonResult {
  screenshotAId: string;
  screenshotBId: string;
  pixelDifference: number;
  structuralDifference: number;
  widgetDifference: number;
  summary: string;
}

// ─── Annotations ────────────────────────────────────────────────────────

export type AnnotationType = "highlight-widget" | "highlight-overflow" | "highlight-spacing" | "highlight-warning";

export interface Annotation {
  id: string;
  type: AnnotationType;
  rect: { x: number; y: number; width: number; height: number };
  label: string;
  color: string;
}

// ─── Sessions ───────────────────────────────────────────────────────────

export interface VisualSession {
  id: string;
  deviceId: string;
  connectedAt: string;
  disconnectedAt?: string;
  screenshotCount: number;
  streamDurationMs: number;
  logCount: number;
  eventCount: number;
  isActive: boolean;
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface VisualMetrics {
  totalScreenshots: number;
  totalStreams: number;
  totalConnections: number;
  averageFps: number;
  jankCount: number;
  layoutIssuesFound: number;
  runtimeErrors: number;
}
