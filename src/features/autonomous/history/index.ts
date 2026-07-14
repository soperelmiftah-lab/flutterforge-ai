/**
 * @module features/autonomous/history
 *
 * History — records all autonomous engineering actions.
 */

import type { HistoryEntry, ProblemCategory } from "../types";
import { uid } from "@/lib/utils";

const history: HistoryEntry[] = [];

export function recordHistory(params: {
  problemTitle: string;
  category: ProblemCategory;
  success: boolean;
  durationMs: number;
  confidence: number;
  rolledBack: boolean;
}): HistoryEntry {
  const entry: HistoryEntry = { id: uid("ahist"), ...params, timestamp: new Date().toISOString() };
  history.unshift(entry);
  if (history.length > 200) history.pop();
  return entry;
}

export function getHistory(limit = 20): HistoryEntry[] {
  return history.slice(0, limit);
}
