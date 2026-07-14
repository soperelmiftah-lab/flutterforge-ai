/**
 * @module features/vision-ai/issues
 *
 * Issue Engine — categorizes all detected issues by severity (critical, high,
 * medium, low, suggestion) and category.
 */

import type { VisionIssue, IssueSeverity, LayoutFinding, WidgetFinding, DesignFinding, AccessibilityFinding, PerformanceFinding } from "../types";
import { uid } from "@/lib/utils";

/** Collect all findings into categorized VisionIssues. */
export function collectIssues(params: {
  layout: LayoutFinding[];
  widget: WidgetFinding[];
  design: DesignFinding[];
  accessibility: AccessibilityFinding[];
  performance: PerformanceFinding[];
}): VisionIssue[] {
  const issues: VisionIssue[] = [];

  for (const f of params.layout) {
    issues.push({
      id: uid("issue"),
      category: "layout",
      severity: f.severity,
      title: `${f.type} issue in ${f.widget}`,
      description: f.message,
      suggestion: f.suggestion,
      evidence: `Layout analysis: ${f.widget} at ${f.rect ? `${f.rect.x},${f.rect.y}` : "unknown position"}`,
    });
  }
  for (const f of params.widget) {
    issues.push({
      id: uid("issue"),
      category: "widget",
      severity: f.severity,
      title: f.message,
      description: `Widget: ${f.widget}`,
      suggestion: f.suggestion,
      evidence: `Widget analysis: ${f.type}`,
    });
  }
  for (const f of params.design) {
    issues.push({
      id: uid("issue"),
      category: "design",
      severity: f.severity,
      title: f.message,
      description: `Design category: ${f.category}`,
      suggestion: f.suggestion,
      evidence: `Design analysis: ${f.category}`,
    });
  }
  for (const f of params.accessibility) {
    issues.push({
      id: uid("issue"),
      category: "accessibility",
      severity: f.severity,
      title: f.message,
      description: `Accessibility: ${f.type}`,
      suggestion: f.suggestion,
      evidence: `Accessibility analysis: ${f.type}`,
    });
  }
  for (const f of params.performance) {
    issues.push({
      id: uid("issue"),
      category: "performance",
      severity: f.severity,
      title: f.message,
      description: `Performance: ${f.type}`,
      suggestion: f.suggestion,
      evidence: `Performance analysis: ${f.type}`,
    });
  }

  return issues.sort((a, b) => severityRank(a.severity) - severityRank(b.severity));
}

function severityRank(s: IssueSeverity): number {
  return { critical: 0, high: 1, medium: 2, low: 3, suggestion: 4 }[s] ?? 5;
}

/** Count issues by severity. */
export function issueStats(issues: VisionIssue[]): Record<IssueSeverity, number> {
  const stats: Record<string, number> = {};
  for (const i of issues) stats[i.severity] = (stats[i.severity] ?? 0) + 1;
  return stats as Record<IssueSeverity, number>;
}
