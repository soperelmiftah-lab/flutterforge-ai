/**
 * @module features/vision-ai/comparison
 *
 * Comparison Engine — compares two screenshots for layout, widget, theme,
 * and visual similarity differences.
 */

import type { ComparisonResult } from "../types";

/** Compare two screenshots (structural — not AI-based). */
export function compareScreenshots(
  a: { id: string; width: number; height: number; orientation: string; deviceId: string },
  b: { id: string; width: number; height: number; orientation: string; deviceId: string }
): ComparisonResult {
  const sizeDiff = Math.abs(a.width - b.width) + Math.abs(a.height - b.height);
  const orientationDiff = a.orientation !== b.orientation;
  const deviceDiff = a.deviceId !== b.deviceId;
  const visualSimilarity = Math.max(0, 100 - (sizeDiff / (a.width + a.height)) * 100 - (orientationDiff ? 20 : 0) - (deviceDiff ? 10 : 0));

  const layoutDifferences: string[] = [];
  if (orientationDiff) layoutDifferences.push(`Orientation changed: ${a.orientation} → ${b.orientation}`);
  if (sizeDiff > 50) layoutDifferences.push(`Resolution changed: ${a.width}x${a.height} → ${b.width}x${b.height}`);

  const widgetDifferences: string[] = [];
  if (deviceDiff) widgetDifferences.push(`Device changed: ${a.deviceId} → ${b.deviceId}`);

  const themeDifferences: string[] = [];
  if (visualSimilarity < 80) themeDifferences.push("Visual appearance has changed significantly");

  const summary = visualSimilarity > 90
    ? "Screenshots are nearly identical"
    : visualSimilarity > 70
      ? "Minor visual differences detected"
      : "Significant visual differences detected";

  return {
    screenshotAId: a.id,
    screenshotBId: b.id,
    visualSimilarity: Math.round(visualSimilarity),
    layoutDifferences,
    widgetDifferences,
    themeDifferences,
    summary,
  };
}
