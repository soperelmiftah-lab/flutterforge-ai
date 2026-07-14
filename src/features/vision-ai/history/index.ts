/**
 * @module features/vision-ai/history
 *
 * History — records analysis history entries.
 */

import type { VisionHistoryEntry } from "../types";
import { uid } from "@/lib/utils";

const history: VisionHistoryEntry[] = [];

export function recordHistory(params: {
  reportId: string;
  deviceId: string;
  overallScore: number;
  confidence: number;
  issueCount: number;
}): VisionHistoryEntry {
  const entry: VisionHistoryEntry = {
    id: uid("vhist"),
    ...params,
    timestamp: new Date().toISOString(),
  };
  history.unshift(entry);
  return entry;
}

export function getHistory(limit = 20): VisionHistoryEntry[] {
  return history.slice(0, limit);
}
