/**
 * @module features/tool-intelligence/learning
 *
 * Learning — tracks successful/failed chains, average duration, tool
 * reliability, and common workflows. Used by the selector to improve
 * future tool choices.
 */

import type { ToolLearningRecord, ToolLearningSummary } from "../types";

const records: ToolLearningRecord[] = [];
const MAX_RECORDS = 2000;

/** Record a tool execution result. */
export function recordExecution(params: {
  toolId: string;
  chainId: string;
  success: boolean;
  durationMs: number;
  tokensUsed: number;
}): void {
  records.push({
    toolId: params.toolId,
    chainId: params.chainId,
    success: params.success,
    durationMs: params.durationMs,
    tokensUsed: params.tokensUsed,
    usedAt: new Date().toISOString(),
  });
  if (records.length > MAX_RECORDS) records.shift();
}

/** Get a learning summary for a tool. */
export function getToolSummary(toolId: string): ToolLearningSummary {
  const toolRecords = records.filter((r) => r.toolId === toolId);
  const totalUses = toolRecords.length;
  const successCount = toolRecords.filter((r) => r.success).length;
  const failureCount = totalUses - successCount;
  const totalDuration = toolRecords.reduce((sum, r) => sum + r.durationMs, 0);
  const totalTokens = toolRecords.reduce((sum, r) => sum + r.tokensUsed, 0);
  const chainIds = new Set(toolRecords.map((r) => r.chainId));

  return {
    toolId,
    totalUses,
    successCount,
    failureCount,
    averageDurationMs: totalUses > 0 ? Math.round(totalDuration / totalUses) : 0,
    averageTokens: totalUses > 0 ? Math.round(totalTokens / totalUses) : 0,
    reliability: totalUses > 0 ? successCount / totalUses : 0,
    commonChains: Array.from(chainIds).slice(0, 5),
  };
}

/** Get learning summaries for all tools. */
export function getAllSummaries(): ToolLearningSummary[] {
  const toolIds = new Set(records.map((r) => r.toolId));
  return Array.from(toolIds).map((id) => getToolSummary(id));
}

/** Get the most reliable tools (for the selector). */
export function getMostReliableTools(limit = 5): Array<{ toolId: string; reliability: number }> {
  return getAllSummaries()
    .filter((s) => s.totalUses > 0)
    .sort((a, b) => b.reliability - a.reliability)
    .slice(0, limit)
    .map((s) => ({ toolId: s.toolId, reliability: s.reliability }));
}

/** Clear all learning records. */
export function clearLearning(): void {
  records.length = 0;
}
