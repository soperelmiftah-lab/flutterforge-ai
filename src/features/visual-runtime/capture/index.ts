/**
 * @module features/visual-runtime/capture
 *
 * Capture — orchestrates screenshot + widget tree + layout + render tree
 * capture in a single operation for comprehensive visual state snapshots.
 */

import type { Screenshot, WidgetTree, LayoutReport, RenderTree } from "../types";
import { captureScreenshot } from "../screenshots";
import { captureWidgetTree } from "../widget-inspector";
import { analyzeLayout } from "../layout-inspector";
import { captureRenderTree } from "../render-tree";

export interface CaptureSnapshot {
  screenshot: Screenshot;
  widgetTree: WidgetTree;
  layoutReport: LayoutReport;
  renderTree: RenderTree;
  capturedAt: string;
}

/** Capture a comprehensive visual snapshot. */
export function captureSnapshot(deviceId: string, device?: { resolution?: string; orientation?: string }): CaptureSnapshot {
  return {
    screenshot: captureScreenshot(deviceId, device),
    widgetTree: captureWidgetTree(),
    layoutReport: analyzeLayout(),
    renderTree: captureRenderTree(),
    capturedAt: new Date().toISOString(),
  };
}
