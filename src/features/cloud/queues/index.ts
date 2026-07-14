/**
 * @module features/cloud/queues
 *
 * Queues — manages the cloud job queue with priority ordering.
 */

import { getQueue, queueStats } from "../scheduler";

export function getQueueStats() { return queueStats(); }
export function getQueuedJobs() { return getQueue().filter((j) => j.status === "queued"); }
export function getRunningJobs() { return getQueue().filter((j) => j.status === "running"); }
