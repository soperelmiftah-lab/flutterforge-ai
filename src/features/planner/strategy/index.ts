/**
 * @module features/planner/strategy
 *
 * Execution Strategy — decides how to run the task graph: sequential,
 * parallel, hybrid, priority-based, risk-based, or token-optimized.
 */

import type { ExecutionStrategy, ExecutionStrategyKind, Task, IntentType } from "../types";

/** Choose the best strategy for a task graph + intent. */
export function chooseStrategy(tasks: Task[], intentType: IntentType): ExecutionStrategy {
  const independentCount = tasks.filter((t) => t.dependsOn.length === 0 && t.dependents.length === 0).length;
  const parallelizable = tasks.filter((t) => t.dependsOn.length === 0).length;
  const hasCritical = tasks.some((t) => t.priority === "critical");
  const hasHighRisk = tasks.some((t) => t.requiredTools.includes("fs.delete_file") || t.requiredTools.includes("flutter.build_apk"));

  let kind: ExecutionStrategyKind = "sequential";
  let maxConcurrent = 1;
  let rationale = "Sequential execution — tasks have linear dependencies.";

  // Parallel if there are multiple independent tasks.
  if (parallelizable > 1 && independentCount > 1) {
    kind = "parallel";
    maxConcurrent = Math.min(4, parallelizable);
    rationale = `Parallel execution — ${parallelizable} tasks can run concurrently.`;
  }

  // Hybrid if there's a mix of independent and dependent tasks.
  if (parallelizable > 1 && tasks.some((t) => t.dependsOn.length > 0)) {
    kind = "hybrid";
    maxConcurrent = 3;
    rationale = "Hybrid execution — mix of parallel and sequential tasks.";
  }

  // Priority-based if there are critical tasks.
  if (hasCritical) {
    kind = "priority-based";
    maxConcurrent = 2;
    rationale = "Priority-based execution — critical tasks run first.";
  }

  // Risk-based if there are high-risk operations.
  if (hasHighRisk) {
    kind = "risk-based";
    maxConcurrent = 1;
    rationale = "Risk-based execution — high-risk operations run sequentially with approval.";
  }

  // Token-optimized for large plans.
  if (tasks.length > 8) {
    kind = "token-optimized";
    maxConcurrent = 2;
    rationale = "Token-optimized execution — minimizing context window usage for large plan.";
  }

  void intentType;
  return { kind, maxConcurrent, rationale };
}

/** Get all strategy kinds (for UI). */
export function listStrategies(): Array<{ kind: ExecutionStrategyKind; label: string; description: string }> {
  return [
    { kind: "sequential", label: "Sequential", description: "One task at a time, in dependency order" },
    { kind: "parallel", label: "Parallel", description: "Multiple independent tasks at once" },
    { kind: "hybrid", label: "Hybrid", description: "Mix of parallel and sequential" },
    { kind: "priority-based", label: "Priority Based", description: "Critical tasks first" },
    { kind: "risk-based", label: "Risk Based", description: "High-risk operations isolated" },
    { kind: "token-optimized", label: "Token Optimized", description: "Minimize context window usage" },
  ];
}
