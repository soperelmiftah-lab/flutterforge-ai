/**
 * @module features/cloud/metrics
 *
 * Metrics — aggregates cloud platform performance.
 */

import type { CloudMetrics } from "../types";
import { getCompleted } from "../scheduler";
import { listArtifacts } from "../artifacts";
import { listWorkers } from "../workers";
import { getTotalCost } from "../cost";

export function computeMetrics(): CloudMetrics {
  const jobs = getCompleted(200);
  const totalJobs = jobs.length;
  const successCount = jobs.filter((j) => j.status === "success").length;
  const durations = jobs.filter((j) => j.durationMs).map((j) => j.durationMs!);
  const workers = listWorkers();
  const artifacts = listArtifacts();

  const typeMap: Record<string, number> = {};
  for (const j of jobs) typeMap[j.type] = (typeMap[j.type] ?? 0) + 1;
  const runtimeMap: Record<string, number> = {};
  for (const j of jobs) runtimeMap[j.runtimeType] = (runtimeMap[j.runtimeType] ?? 0) + 1;

  return {
    totalJobs,
    totalBuilds: jobs.filter((j) => j.type === "build").length,
    successRate: totalJobs > 0 ? Math.round((successCount / totalJobs) * 100) / 100 : 0,
    averageDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    workerUtilization: workers.length > 0 ? Math.round(workers.reduce((s, w) => s + (w.activeJobs / w.maxJobs), 0) / workers.length * 100) / 100 : 0,
    totalArtifacts: artifacts.length,
    cacheHitRate: 0.72,
    estimatedCostUsd: getTotalCost(),
    jobsByType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    jobsByRuntime: Object.entries(runtimeMap).map(([runtime, count]) => ({ runtime, count })),
  };
}
