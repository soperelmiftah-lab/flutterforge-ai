/**
 * @module features/cloud/logs
 *
 * Cloud Logs — collects logs from all cloud jobs and workers.
 */

import type { CloudJob } from "../types";

export function getJobLogs(job: CloudJob): { stdout: string[]; stderr: string[] } {
  return { stdout: job.stdout, stderr: job.stderr };
}

export function formatJobLog(job: CloudJob): string {
  return `[${job.id}] ${job.command} ${job.args.join(" ")}\n${job.stdout.join("\n")}${job.stderr.length > 0 ? "\n--- stderr ---\n" + job.stderr.join("\n") : ""}`;
}
