/**
 * @module features/visual-runtime/layout-inspector
 *
 * Layout Inspector — detects overflow, unbounded constraints, clipping,
 * alignment issues, and spacing issues.
 */

import type { LayoutReport, LayoutIssue } from "../types";
import { uid } from "@/lib/utils";

/** Analyze the current layout for issues (mock — would use Flutter Inspector). */
export function analyzeLayout(): LayoutReport {
  const issues: LayoutIssue[] = [
    {
      id: uid("layout"),
      type: "overflow",
      severity: "error",
      widgetId: "column_1",
      widgetType: "Column",
      message: "Bottom overflowed by 42 pixels",
      rect: { x: 0, y: 780, width: 360, height: 42 },
    },
    {
      id: uid("layout"),
      type: "alignment-issue",
      severity: "warning",
      widgetId: "text_2",
      widgetType: "Text",
      message: "Text is not vertically centered in its container",
      rect: { x: 16, y: 120, width: 328, height: 24 },
    },
    {
      id: uid("layout"),
      type: "spacing-issue",
      severity: "info",
      widgetId: "column_1",
      widgetType: "Column",
      message: "Inconsistent vertical spacing between children (8px vs 16px)",
      rect: { x: 16, y: 200, width: 328, height: 400 },
    },
  ];

  return {
    issues,
    totalWidgets: 12,
    issueCount: issues.length,
    capturedAt: new Date().toISOString(),
  };
}
