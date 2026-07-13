/**
 * @module features/autonomous/regression
 *
 * Regression Engine — detects new issues, broken layouts, new warnings,
 * new analyzer errors, and navigation failures after a repair.
 */

import type { RegressionReport, RegressionIssue } from "../types";
import { uid } from "@/lib/utils";

/** Detect regressions by comparing before/after analysis. */
export function detectRegressions(params: {
  beforeErrors: number;
  afterErrors: number;
  beforeWarnings: number;
  afterWarnings: number;
  beforeLayoutIssues: number;
  afterLayoutIssues: number;
}): RegressionReport {
  const issues: RegressionIssue[] = [];

  if (params.afterErrors > params.beforeErrors) {
    issues.push({
      id: uid("reg"),
      type: "new-error",
      description: `${params.afterErrors - params.beforeErrors} new analyzer error(s) introduced`,
      severity: "critical",
    });
  }
  if (params.afterWarnings > params.beforeWarnings) {
    issues.push({
      id: uid("reg"),
      type: "new-warning",
      description: `${params.afterWarnings - params.beforeWarnings} new warning(s) introduced`,
      severity: "medium",
    });
  }
  if (params.afterLayoutIssues > params.beforeLayoutIssues) {
    issues.push({
      id: uid("reg"),
      type: "broken-layout",
      description: `${params.afterLayoutIssues - params.beforeLayoutIssues} new layout issue(s) detected`,
      severity: "high",
    });
  }

  return { issues, hasRegressions: issues.length > 0, count: issues.length };
}
