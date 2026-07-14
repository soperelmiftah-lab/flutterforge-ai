/**
 * @module features/vision-ai/confidence
 *
 * Confidence Engine — generates a confidence score with evidence and reasoning.
 */

import type { ConfidenceReport } from "../types";

/** Compute confidence from analysis quality factors. */
export function computeConfidence(params: {
  hasScreenshot: boolean;
  hasWidgetTree: boolean;
  hasRenderTree: boolean;
  hasLayoutReport: boolean;
  hasConsole: boolean;
  hasPerformance: boolean;
  issueCount: number;
}): ConfidenceReport {
  const factors = [
    { name: "Screenshot", weight: 0.2, value: params.hasScreenshot ? 1 : 0 },
    { name: "Widget Tree", weight: 0.25, value: params.hasWidgetTree ? 1 : 0 },
    { name: "Render Tree", weight: 0.1, value: params.hasRenderTree ? 1 : 0 },
    { name: "Layout Report", weight: 0.2, value: params.hasLayoutReport ? 1 : 0 },
    { name: "Console", weight: 0.1, value: params.hasConsole ? 1 : 0 },
    { name: "Performance", weight: 0.15, value: params.hasPerformance ? 1 : 0 },
  ];

  const score = factors.reduce((sum, f) => sum + f.weight * f.value, 0);

  const evidence: string[] = [];
  if (params.hasScreenshot) evidence.push("Screenshot available for visual analysis");
  if (params.hasWidgetTree) evidence.push("Widget tree captured for hierarchy analysis");
  if (params.hasRenderTree) evidence.push("Render tree captured for performance analysis");
  if (params.hasLayoutReport) evidence.push("Layout report available for issue detection");
  if (params.hasConsole) evidence.push("Console logs available for error correlation");
  if (params.hasPerformance) evidence.push("Performance metrics available for jank detection");

  const missing = factors.filter((f) => f.value === 0).map((f) => f.name);
  const reasoning = `Confidence based on ${evidence.length}/6 data sources.`
    + (missing.length > 0 ? ` Missing: ${missing.join(", ")}.` : "")
    + ` Detected ${params.issueCount} issues.`;

  return { score: Math.round(score * 100) / 100, evidence, reasoning, factors };
}
