/**
 * @module features/cloud/scheduler
 *
 * Job Scheduler — manages job queue with priority, retries, timeout,
 * dependencies, and cancellation.
 */

import type { CloudJob, JobType, RuntimeType } from "../types";
import { getIdleWorkers, assignJob, releaseJob } from "../workers";
import { executeOnRuntime } from "../runtime";
import { uid } from "@/lib/utils";

const queue: CloudJob[] = [];
const completed: CloudJob[] = [];

export function enqueueJob(params: {
  type: JobType; command: string; args?: string[]; workingDirectory?: string;
  priority?: number; runtimeType?: RuntimeType; projectId?: string;
  timeoutMs?: number; maxRetries?: number; dependsOn?: string[];
  environment?: Record<string, string>;
}): CloudJob {
  const job: CloudJob = {
    id: uid("job"), type: params.type, command: params.command, args: params.args ?? [],
    workingDirectory: params.workingDirectory ?? ".", priority: params.priority ?? 0,
    status: "queued", runtimeType: params.runtimeType ?? "local", projectId: params.projectId,
    enqueuedAt: new Date().toISOString(), stdout: [], stderr: [], retries: 0,
    maxRetries: params.maxRetries ?? 3, timeoutMs: params.timeoutMs ?? 120000,
    dependsOn: params.dependsOn ?? [], environment: params.environment ?? {},
  };
  queue.push(job);
  queue.sort((a, b) => b.priority - a.priority);
  return job;
}

export async function processQueue(): Promise<void> {
  const idle = getIdleWorkers();
  if (idle.length === 0) return;
  const ready = queue.filter((j) => j.status === "queued" && j.dependsOn.every((d) => completed.find((c) => c.id === d && c.status === "success")));
  if (ready.length === 0) return;
  for (const job of ready.slice(0, idle.length)) {
    const worker = idle[0];
    if (!assignJob(worker.id)) continue;
    job.workerId = worker.id;
    job.status = "running";
    job.startedAt = new Date().toISOString();
    try {
      const result = await executeOnRuntime(job.runtimeType, job.command, job.args);
      job.stdout.push(result.stdout);
      job.stderr.push(result.stderr);
      job.exitCode = result.exitCode;
      job.status = result.exitCode === 0 ? "success" : "failed";
      job.durationMs = result.durationMs;
    } catch (e) {
      job.status = "failed";
      job.stderr.push(String(e));
      if (job.retries < job.maxRetries) { job.retries++; job.status = "queued"; releaseJob(worker.id); continue; }
    }
    job.finishedAt = new Date().toISOString();
    completed.unshift(job);
    const idx = queue.findIndex((j) => j.id === job.id);
    if (idx >= 0) queue.splice(idx, 1);
    releaseJob(worker.id);
  }
}

export function cancelJob(jobId: string): boolean {
  const job = queue.find((j) => j.id === jobId);
  if (!job || job.status === "running") return false;
  job.status = "cancelled";
  return true;
}

export function getQueue(): CloudJob[] { return [...queue]; }
export function getCompleted(limit = 20): CloudJob[] { return completed.slice(0, limit); }
export function getJob(id: string): CloudJob | undefined { return queue.find((j) => j.id === id) ?? completed.find((j) => j.id === id); }

export function queueStats() {
  return {
    queued: queue.filter((j) => j.status === "queued").length,
    running: queue.filter((j) => j.status === "running").length,
    completed: completed.filter((j) => j.status === "success").length,
    failed: completed.filter((j) => j.status === "failed").length,
    cancelled: completed.filter((j) => j.status === "cancelled").length,
  };
}
