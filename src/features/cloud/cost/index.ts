/**
 * @module features/cloud/cost
 *
 * Cost Engine — estimates execution cost, runtime duration, and worker
 * utilization.
 */

import type { CostEstimate, RuntimeType } from "../types";

const costPerMinute: Record<RuntimeType, number> = { local: 0, docker: 0.01, remote: 0.05, cloud: 0.10, ci: 0.08 };

export function estimateCost(runtimeType: RuntimeType, estimatedDurationMs: number, workerUtilization: number = 0.5): CostEstimate {
  const minutes = estimatedDurationMs / 60000;
  return {
    runtimeType,
    estimatedDurationMs,
    estimatedCostUsd: Math.round(costPerMinute[runtimeType] * minutes * 100) / 100,
    workerUtilization,
  };
}

export function getTotalCost(): number {
  return 0; // Would accumulate from job history
}
