/**
 * @module features/visual-runtime/frame-monitor
 *
 * Frame Monitor — tracks FPS, dropped frames, frame duration, and jank.
 */

import type { FrameStats } from "../types";

let currentStats: FrameStats = {
  fps: 60,
  droppedFrames: 0,
  avgFrameDurationMs: 16.6,
  maxFrameDurationMs: 18.2,
  jankCount: 0,
  isJanky: false,
  capturedAt: new Date().toISOString(),
};

/** Get current frame stats (mock — would read from Flutter Engine). */
export function getFrameStats(): FrameStats {
  // Simulate slight variation.
  const variation = (Math.random() - 0.5) * 4;
  currentStats = {
    fps: Math.round(Math.max(30, Math.min(60, 60 + variation))),
    droppedFrames: Math.floor(Math.max(0, -variation * 2)),
    avgFrameDurationMs: Math.round((16666 + variation * 1000) / 100) / 10,
    maxFrameDurationMs: Math.round((18200 + variation * 1500) / 100) / 10,
    jankCount: currentStats.jankCount + (variation < -3 ? 1 : 0),
    isJanky: variation < -3,
    capturedAt: new Date().toISOString(),
  };
  return currentStats;
}

/** Reset jank stats. */
export function resetJankStats(): void {
  currentStats.jankCount = 0;
  currentStats.droppedFrames = 0;
}
