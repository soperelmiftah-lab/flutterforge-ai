/**
 * @module features/planner/evaluation
 *
 * Evaluation Engine — assesses the success and quality of a completed plan.
 */

import type { Evaluation, Plan } from "../types";
import { uid } from "@/lib/utils";

/** Evaluate a completed plan. */
export function evaluatePlan(plan: Plan): Evaluation {
  const tasksTotal = plan.tasks.length;
  const tasksCompleted = plan.tasks.filter((t) => t.status === "completed").length;
  const failedTasks = plan.tasks.filter((t) => t.status === "failed");
  const errorCount = failedTasks.length;
  const retryCount = plan.tasks.reduce((sum, t) => sum + (t.status === "failed" ? 1 : 0), 0);

  const totalDurationMs = plan.tasks.reduce(
    (sum, t) => sum + (t.actualDurationMs ?? t.estimatedDurationMs),
    0
  );
  const estimatedTotal = plan.estimatedDurationMs;
  const estimateAccuracy = estimatedTotal > 0
    ? Math.min(1, estimatedTotal / Math.max(totalDurationMs, 1))
    : 0;

  const successRate = tasksTotal > 0 ? tasksCompleted / tasksTotal : 0;
  const quality = computeQuality(plan);
  const confidence = computeConfidence(successRate, errorCount, tasksTotal);

  const notes: string[] = [];
  if (successRate === 1) notes.push("All tasks completed successfully.");
  else if (successRate >= 0.8) notes.push("Most tasks completed; some failures.");
  else notes.push("Multiple task failures — plan may need revision.");
  if (estimateAccuracy < 0.5) notes.push("Duration estimate was significantly off.");
  if (retryCount > 0) notes.push(`${retryCount} task(s) required retries.`);

  return {
    id: uid("eval"),
    planId: plan.id,
    successRate,
    tasksCompleted,
    tasksTotal,
    quality,
    errorCount,
    retryCount,
    totalDurationMs,
    estimateAccuracy,
    confidence,
    notes,
    createdAt: new Date().toISOString(),
  };
}

function computeQuality(plan: Plan): number {
  const completed = plan.tasks.filter((t) => t.status === "completed");
  if (completed.length === 0) return 0;
  // Quality = avg of (1 - complexity_penalty) for completed tasks.
  const complexityPenalty = { trivial: 0, simple: 0.05, moderate: 0.1, complex: 0.2, "very-complex": 0.3 };
  const scores = completed.map((t) => 1 - complexityPenalty[t.complexity]);
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function computeConfidence(successRate: number, errorCount: number, total: number): number {
  if (total === 0) return 0;
  const base = successRate;
  const penalty = (errorCount / total) * 0.3;
  return Math.max(0, Math.min(1, base - penalty));
}
