# Visual Runtime & Android Device Bridge

The Visual Runtime connects the Flutter Runtime Platform with physical devices, emulators, and browser previews while exposing visual feedback to AI. This phase focuses on observation — no autonomous repair, no code modification, no cloud build.

## Architecture

```
Planner → Tool Intelligence → Flutter Platform → Runtime Platform → Visual Runtime → Android Device Bridge → Flutter App
```

## Modules (19)

| Module | Purpose |
|--------|---------|
| types/ | Core domain types (BridgeDevice, Screenshot, WidgetTree, LayoutReport, etc.) |
| device-bridge/ | Bridge coordinator (connect/disconnect/reconnect) |
| adb/ | ADB discovery, USB/wireless/emulator, pairing, device info |
| screenshots/ | Capture screenshots with metadata, history, resolution, orientation |
| screen-stream/ | Live preview stream (start/stop/pause/reconnect/multi-viewer) |
| widget-inspector/ | Widget hierarchy (parent/children/properties/keys/state) |
| layout-inspector/ | Detect overflow, unbounded constraints, clipping, alignment, spacing |
| render-tree/ | RenderObjects with depth, layout time, paint time |
| preview/ | Preview manager (Android/Chrome/Desktop, zoom, rotate, orientation) |
| frame-monitor/ | FPS, dropped frames, frame duration, jank |
| performance-overlay/ | Raster time, UI thread, GPU, memory |
| console-stream/ | Runtime exceptions, Flutter/Dart/platform logs |
| events/ | Tap, long-press, scroll, navigation, keyboard, lifecycle events |
| sessions/ | Visual session persistence (devices, screenshots, streams, logs) |
| vision-context/ | Structured visual context for AI consumption |
| capture/ | Comprehensive capture snapshot (screenshot + widget + layout + render) |
| comparison/ | Screenshot structural comparison |
| annotations/ | Visual annotations (highlight widget/overflow/spacing/warning) |
| metrics/ | Screenshots, streams, connections, FPS, jank, layout issues, errors |

## API endpoints (12)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/visual/connect | Connect to a device |
| POST | /api/v1/visual/disconnect | Disconnect from a device |
| POST | /api/v1/visual/capture | Capture a screenshot |
| POST | /api/v1/visual/stream/start | Start a screen stream |
| POST | /api/v1/visual/stream/stop | Stop a screen stream |
| GET | /api/v1/visual/devices | List discovered devices |
| GET | /api/v1/visual/screenshots | List screenshots |
| GET | /api/v1/visual/widget-tree | Get widget tree |
| GET | /api/v1/visual/layout | Get layout analysis |
| GET | /api/v1/visual/render-tree | Get render tree |
| GET | /api/v1/visual/events | Get visual events |
| GET | /api/v1/visual/metrics | Get visual metrics |

## UI — 13 panels

| Panel | Purpose |
|-------|---------|
| Visual Runtime | Dashboard with metrics + navigation cards |
| Android Bridge | Device list with connect/disconnect, device info |
| Device Preview | Live preview with capture and stream controls |
| Screenshots | Gallery with thumbnail list + full view |
| Widget Inspector | Widget hierarchy tree with properties/keys |
| Layout Inspector | Layout issues (overflow, alignment, spacing) |
| Render Tree | RenderObject tree with layout/paint times |
| Frame Monitor | Live FPS, dropped frames, jank with bar chart |
| Performance | Raster/UI/GPU/memory bars (live) |
| Console | Runtime logs with level/source coloring |
| Events | Tap/scroll/navigation/lifecycle events |
| Vision Context | Structured visual context for AI |
| Metrics | Aggregated visual runtime metrics |

## Vision Context

The Vision Context module provides structured visual context that future AI agents will consume for autonomous debugging and UI refinement:

```typescript
interface VisionContext {
  deviceId: string;
  currentScreen: string;
  widgetTreeSummary: { totalWidgets, maxDepth, topWidgets };
  layoutSummary: { totalIssues, overflowCount };
  runtimeState: { fps, jankCount, memoryMb };
  navigationState: { currentRoute, routeStack };
  deviceInfo: { name, resolution, orientation };
}
```

## Android Device Bridge

Supports:
- ADB device discovery (USB, wireless, emulator)
- Pairing code generation for wireless debugging
- Reconnection
- Device info: manufacturer, model, ABI, SDK, Android version, battery, storage, memory, resolution, density, orientation
