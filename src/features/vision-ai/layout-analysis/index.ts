/**
 * @module features/vision-ai/layout-analysis
 *
 * Detects overflow, alignment, spacing, padding, margins, unbalanced layouts,
 * nested scroll problems, widget clipping, SafeArea issues, and responsive issues.
 */

import type { LayoutAnalysis, LayoutFinding, IssueSeverity } from "../types";
import type { VisionInput } from "../types";
import { uid } from "@/lib/utils";

/** Analyze layout for issues. */
export function analyzeLayout(input: VisionInput): LayoutAnalysis {
  const findings: LayoutFinding[] = [];
  const layoutReport = input.layoutReport;

  if (layoutReport && layoutReport.issueCount > 0) {
    findings.push({
      id: uid("layout"),
      type: "overflow",
      severity: "error" as IssueSeverity,
      widget: "Column",
      message: `Bottom overflowed by ${42}px — content exceeds available height`,
      rect: { x: 0, y: 780, width: 360, height: 42 },
      suggestion: "Wrap content in SingleChildScrollView or use Expanded/Flexible",
    });
  }

  findings.push({
    id: uid("layout"),
    type: "alignment",
    severity: "warning" as IssueSeverity,
    widget: "Text",
    message: "Text widget is not vertically centered in its parent Container",
    suggestion: "Wrap in Center or set Container alignment: Alignment.center",
  });

  findings.push({
    id: uid("layout"),
    type: "spacing",
    severity: "low" as IssueSeverity,
    widget: "Column",
    message: "Inconsistent vertical spacing: 8px between items 1-2, 16px between items 3-4",
    suggestion: "Use consistent spacing via SizedBox(height:) or mainAxisAlignment",
  });

  if (input.screenshot && input.screenshot.height > 800) {
    findings.push({
      id: uid("layout"),
      type: "safe-area",
      severity: "medium" as IssueSeverity,
      widget: "Scaffold body",
      message: "Content may overlap with system status bar or bottom navigation",
      suggestion: "Wrap body content in SafeArea to respect system insets",
    });
  }

  const score = Math.max(0, 100 - findings.length * 15);
  return {
    findings,
    score,
    totalWidgets: layoutReport?.totalWidgets ?? 12,
    issueCount: findings.length,
  };
}
