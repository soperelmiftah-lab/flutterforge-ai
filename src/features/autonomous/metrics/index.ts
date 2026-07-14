/**
 * @module features/autonomous/metrics
 *
 * Metrics — aggregates autonomous engineering performance.
 */

import type { AutonomousMetrics } from "../types";
import { getHistory } from "../history";

export function computeMetrics(): AutonomousMetrics {
  const history = getHistory(200);

  const totalProblems = history.length;
  const totalRepairs = history.filter((h) => h.success).length;
  const successRate = totalProblems > 0 ? totalRepairs / totalProblems : 0;
  const averageConfidence = totalProblems > 0 ? history.reduce((s, h) => s + h.confidence, 0) / totalProblems : 0;
  const rollbackCount = history.filter((h) => h.rolledBack).length;
  const averageDurationMs = totalProblems > 0 ? Math.round(history.reduce((s, h) => s + h.durationMs, 0) / totalProblems) : 0;

  const catMap: Record<string, number> = {};
  for (const h of history) catMap[h.category] = (catMap[h.category] ?? 0) + 1;
  const commonProblemCategories = Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

  return {
    totalProblems,
    totalRepairs,
    successRate: Math.round(successRate * 100) / 100,
    averageConfidence: Math.round(averageConfidence * 100) / 100,
    rollbackCount,
    averageDurationMs,
    commonProblemCategories,
  };
}
