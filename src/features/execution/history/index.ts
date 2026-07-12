/**
 * @module features/execution/history
 *
 * History Manager — records every execution (tool, parameters, result,
 * duration, errors, who initiated). Powers the Execution History UI.
 */

import type { HistoryEntry, ExecutionStatus, RiskLevel, ToolCategory } from "../types";
import { uid } from "@/lib/utils";

const entries: HistoryEntry[] = [];
const MAX_ENTRIES = 500;

/** Record a completed execution. */
export function recordHistory(params: {
  requestId: string;
  toolId: string;
  toolName: string;
  category: ToolCategory;
  parameters: Record<string, unknown>;
  status: ExecutionStatus;
  riskLevel: RiskLevel;
  initiatedBy: "user" | "agent";
  agentId?: string;
  output?: unknown;
  error?: string;
  patchId?: string;
  snapshotId?: string;
  durationMs: number;
}): HistoryEntry {
  const entry: HistoryEntry = {
    id: uid("hist"),
    createdAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    ...params,
  };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.pop();
  return entry;
}

/** Get all history entries, optionally filtered. */
export function getHistory(filter?: {
  toolId?: string;
  category?: ToolCategory;
  status?: ExecutionStatus;
  initiatedBy?: "user" | "agent";
  limit?: number;
}): HistoryEntry[] {
  let out = [...entries];
  if (filter?.toolId) out = out.filter((e) => e.toolId === filter.toolId);
  if (filter?.category) out = out.filter((e) => e.category === filter.category);
  if (filter?.status) out = out.filter((e) => e.status === filter.status);
  if (filter?.initiatedBy) out = out.filter((e) => e.initiatedBy === filter.initiatedBy);
  return out.slice(0, filter?.limit ?? 100);
}

/** Get a single history entry. */
export function getHistoryEntry(id: string): HistoryEntry | undefined {
  return entries.find((e) => e.id === id);
}

/** Get a history entry by request id. */
export function getByRequestId(requestId: string): HistoryEntry | undefined {
  return entries.find((e) => e.requestId === requestId);
}

/** Clear all history. */
export function clearHistory(): void {
  entries.length = 0;
}

/** Summary stats. */
export function historySummary(): {
  total: number;
  success: number;
  failed: number;
  rolledBack: number;
} {
  return {
    total: entries.length,
    success: entries.filter((e) => e.status === "success").length,
    failed: entries.filter((e) => e.status === "failed").length,
    rolledBack: entries.filter((e) => e.status === "rolled-back").length,
  };
}
