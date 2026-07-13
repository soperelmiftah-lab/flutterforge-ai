/**
 * @module features/visual-runtime/performance-overlay
 *
 * Performance Overlay — exposes raster time, UI thread time, GPU time,
 * and memory usage.
 */

import type { PerformanceOverlay } from "../types";

/** Get current performance overlay data (mock). */
export function getPerformanceOverlay(): PerformanceOverlay {
  return {
    rasterTimeMs: Math.round((Math.random() * 4 + 2) * 10) / 10,
    uiThreadTimeMs: Math.round((Math.random() * 6 + 3) * 10) / 10,
    gpuTimeMs: Math.round((Math.random() * 3 + 1) * 10) / 10,
    memoryMb: Math.round(Math.random() * 200 + 150),
    capturedAt: new Date().toISOString(),
  };
}
