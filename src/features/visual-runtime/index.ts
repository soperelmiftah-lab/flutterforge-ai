/**
 * @module features/visual-runtime
 *
 * Visual Runtime & Android Device Bridge — connects the Flutter Runtime
 * Platform with physical devices, emulators, and browser previews while
 * exposing visual feedback to AI.
 *
 * Sub-modules:
 *   types/               Core domain types
 *   device-bridge/       Bridge coordinator
 *   adb/                 ADB device discovery, pairing, connection
 *   screenshots/         Screenshot capture engine
 *   screen-stream/       Live preview stream
 *   widget-inspector/    Widget hierarchy inspector
 *   layout-inspector/    Layout issue detector
 *   render-tree/         RenderObject tree
 *   preview/             Preview manager (Android/Chrome/Desktop)
 *   frame-monitor/       FPS, dropped frames, jank
 *   performance-overlay/  Raster, UI, GPU, memory
 *   console-stream/      Runtime exceptions and logs
 *   events/              Tap, scroll, navigation, lifecycle events
 *   sessions/            Visual session persistence
 *   vision-context/      Structured visual context for AI
 *   capture/             Comprehensive capture snapshot
 *   comparison/          Screenshot comparison engine
 *   annotations/         Visual annotations
 *   metrics/             Aggregated metrics
 */

export * from "./types";
export * from "./device-bridge";
export * from "./adb";
export * from "./screenshots";
export * from "./screen-stream";
export * from "./widget-inspector";
export * from "./layout-inspector";
export * from "./render-tree";
export * from "./preview";
export * from "./frame-monitor";
export * from "./performance-overlay";
export * from "./console-stream";
export * from "./events";
export * from "./sessions";
export * from "./vision-context";
export * from "./capture";
export * from "./comparison";
export * from "./annotations";
export * from "./metrics";
// Phase 9 — shared in-memory visual runtime state.
export * from "./state";
