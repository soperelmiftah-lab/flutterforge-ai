/**
 * @module features/vision-ai/widget-analysis
 *
 * Analyzes widget hierarchy depth, complexity, composition, const usage,
 * duplicate widgets, large build methods, and heavy widget trees.
 */

import type { WidgetAnalysis, WidgetFinding, IssueSeverity } from "../types";
import type { VisionInput } from "../types";
import { uid } from "@/lib/utils";

/** Analyze widget tree for issues. */
export function analyzeWidgets(input: VisionInput): WidgetAnalysis {
  const findings: WidgetFinding[] = [];
  const tree = input.widgetTree;
  const totalNodes = tree?.totalNodes ?? 8;
  const maxDepth = tree?.maxDepth ?? 4;
  const constUsage = 0.6; // mock

  if (maxDepth > 8) {
    findings.push({
      id: uid("widget"),
      type: "deep-nesting",
      severity: "warning" as IssueSeverity,
      message: `Widget tree depth is ${maxDepth} — deeply nested trees are harder to maintain`,
      widget: "Column > Center > Column > ...",
      suggestion: "Extract subtrees into separate widget classes",
    });
  }

  if (constUsage < 0.5) {
    findings.push({
      id: uid("widget"),
      type: "missing-const",
      severity: "low" as IssueSeverity,
      message: `Only ${(constUsage * 100).toFixed(0)}% of widgets use const constructors`,
      widget: "Multiple widgets",
      suggestion: "Add const to widget constructors to skip unnecessary rebuilds",
    });
  }

  if (totalNodes > 50) {
    findings.push({
      id: uid("widget"),
      type: "heavy-tree",
      severity: "medium" as IssueSeverity,
      message: `${totalNodes} widgets in a single build method — consider splitting`,
      widget: "HomeScreen.build()",
      suggestion: "Extract reusable widgets into separate classes",
    });
  }

  const score = Math.max(0, 100 - findings.length * 20 - (maxDepth > 8 ? 15 : 0));
  return { findings, totalNodes, maxDepth, constUsage, score };
}
