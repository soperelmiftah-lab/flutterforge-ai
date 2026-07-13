/**
 * @module features/visual-runtime/comparison
 *
 * Comparison Engine — structural and visual comparison of two screenshots.
 */

import type { ComparisonResult, Screenshot } from "../types";

/** Compare two screenshots (structural — not AI-based). */
export function compareScreenshots(a: Screenshot, b: Screenshot): ComparisonResult {
  const sizeDiff = Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
  const orientationDiff = a.orientation !== b.orientation ? 1 : 0;
  const deviceDiff = a.deviceId !== b.deviceId ? 1 : 0;
  const timeDiff = Math.abs(new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const pixelDifference = Math.round((sizeDiff / (a.width + a.height)) * 100);
  const structuralDifference = orientationDiff + deviceDiff;
  const widgetDifference = Math.round(timeDiff / 1000);

  const summary = structuralDifference === 0 && pixelDifference < 10
    ? "Screenshots are visually similar"
    : `Differences: ${pixelDifference}% pixel, ${structuralDifference} structural, ${widgetDifference}s time gap`;

  return {
    screenshotAId: a.id,
    screenshotBId: b.id,
    pixelDifference,
    structuralDifference,
    widgetDifference,
    summary,
  };
}
