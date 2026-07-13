/**
 * @module features/visual-runtime/metrics
 *
 * Metrics — tracks screenshots, streams, connections, FPS, jank, layout
 * issues, and runtime errors.
 */

import type { VisualMetrics } from "../types";
import { getScreenshots } from "../screenshots";
import { getAllStreams } from "../screen-stream";
import { getConnectedDevices } from "../adb";
import { getFrameStats } from "../frame-monitor";
import { analyzeLayout } from "../layout-inspector";
import { getEntries } from "../console-stream";

/** Compute visual runtime metrics. */
export function computeMetrics(): VisualMetrics {
  const screenshots = getScreenshots();
  const streams = getAllStreams();
  const devices = getConnectedDevices();
  const frame = getFrameStats();
  const layout = analyzeLayout();
  const errors = getEntries({ level: "error" });

  return {
    totalScreenshots: screenshots.length,
    totalStreams: streams.length,
    totalConnections: devices.length,
    averageFps: frame.fps,
    jankCount: frame.jankCount,
    layoutIssuesFound: layout.issueCount,
    runtimeErrors: errors.length,
  };
}
