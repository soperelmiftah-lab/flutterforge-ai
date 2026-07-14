/**
 * @module features/cloud/monitoring
 *
 * Monitoring — tracks worker health, CPU, RAM, queue, failures, success,
 * and duration.
 */

import type { MonitoringSnapshot } from "../types";
import { listWorkers } from "../workers";
import { queueStats, getCompleted } from "../scheduler";

export function getSnapshot(): MonitoringSnapshot {
  const workers = listWorkers();
  const stats = queueStats();
  const completed = getCompleted(100);
  const successCount = completed.filter((j) => j.status === "success").length;
  const durations = completed.filter((j) => j.durationMs).map((j) => j.durationMs!);
  return {
    totalWorkers: workers.length,
    activeWorkers: workers.filter((w) => w.status !== "offline").length,
    queuedJobs: stats.queued,
    runningJobs: stats.running,
    completedJobs: stats.completed,
    failedJobs: stats.failed,
    averageCpu: Math.round(workers.reduce((s, w) => s + w.cpuUsage, 0) / Math.max(1, workers.length)),
    averageMemory: Math.round(workers.reduce((s, w) => s + w.memoryUsage, 0) / Math.max(1, workers.length)),
    successRate: completed.length > 0 ? successCount / completed.length : 0,
    averageDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
  };
}
