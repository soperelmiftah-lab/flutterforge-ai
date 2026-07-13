/**
 * @module features/autonomous/learning
 *
 * Learning Engine — stores successful repairs, rejected patches, execution
 * outcomes, and common issue patterns.
 */

import type { LearningRecord, LearningSummary, ProblemCategory } from "../types";
import { uid } from "@/lib/utils";

const records: LearningRecord[] = [];

/** Record a learning entry. */
export function recordLearning(params: {
  problemCategory: ProblemCategory;
  repairStrategy: string;
  success: boolean;
  confidence: number;
  durationMs: number;
}): void {
  records.push({
    id: uid("learn"),
    ...params,
    learnedAt: new Date().toISOString(),
  });
  if (records.length > 500) records.shift();
}

/** Get learning summary. */
export function getLearningSummary(): LearningSummary {
  const total = records.length;
  const successCount = records.filter((r) => r.success).length;

  const strategyMap: Record<string, { count: number; success: number }> = {};
  for (const r of records) {
    if (!strategyMap[r.repairStrategy]) strategyMap[r.repairStrategy] = { count: 0, success: 0 };
    strategyMap[r.repairStrategy].count++;
    if (r.success) strategyMap[r.repairStrategy].success++;
  }

  const commonStrategies = Object.entries(strategyMap)
    .map(([strategy, v]) => ({ strategy, count: v.count, successRate: v.count > 0 ? v.success / v.count : 0 }))
    .sort((a, b) => b.count - a.count);

  const issueMap: Record<string, number> = {};
  for (const r of records) issueMap[r.problemCategory] = (issueMap[r.problemCategory] ?? 0) + 1;
  const commonIssues = Object.entries(issueMap)
    .map(([category, count]) => ({ category: category as ProblemCategory, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalRepairs: total,
    successRate: total > 0 ? successCount / total : 0,
    commonStrategies,
    commonIssues,
  };
}

/** Get all learning records. */
export function getRecords(): LearningRecord[] {
  return [...records].reverse();
}
