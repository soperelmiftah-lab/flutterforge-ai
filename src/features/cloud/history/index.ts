/**
 * @module features/cloud/history
 *
 * History — records cloud execution history.
 */

import type { CloudHistoryEntry, JobType, RuntimeType } from "../types";
import { uid } from "@/lib/utils";

const history: CloudHistoryEntry[] = [];

export function recordHistory(params: { jobId: string; type: JobType; runtimeType: RuntimeType; success: boolean; durationMs: number; workerName?: string }): CloudHistoryEntry {
  const e: CloudHistoryEntry = { id: uid("chist"), ...params, timestamp: new Date().toISOString() };
  history.unshift(e);
  if (history.length > 200) history.pop();
  return e;
}

export function getHistory(limit = 20): CloudHistoryEntry[] { return history.slice(0, limit); }
