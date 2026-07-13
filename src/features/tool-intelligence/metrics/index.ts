/**
 * @module features/tool-intelligence/metrics
 *
 * Metrics — aggregates Tool Intelligence performance: chain count, average
 * chain length, retry count, simulation accuracy, failure rate, recovery
 * rate, optimization score, and per-tool usage.
 */

import type { ToolIntelligenceMetrics } from "../types";
import { getAllSummaries } from "../learning";

/** Compute current Tool Intelligence metrics. */
export function computeMetrics(chains: Array<{
  steps: unknown[];
  optimized: boolean;
  riskScore: number;
}>): ToolIntelligenceMetrics {
  const totalChains = chains.length;
  const averageChainLength = totalChains > 0
    ? Math.round(chains.reduce((sum, c) => sum + c.steps.length, 0) / totalChains)
    : 0;

  const summaries = getAllSummaries();
  const totalRetries = summaries.reduce((sum, s) => sum + s.failureCount, 0);
  const totalExecutions = summaries.reduce((sum, s) => sum + s.totalUses, 0);
  const failureRate = totalExecutions > 0 ? totalRetries / totalExecutions : 0;
  const recoveryRate = totalExecutions > 0
    ? summaries.reduce((sum, s) => sum + s.successCount, 0) / totalExecutions
    : 0;

  const optimizationScore = totalChains > 0
    ? chains.filter((c) => c.optimized).length / totalChains
    : 0;

  const toolUsage = summaries
    .map((s) => ({ toolId: s.toolId, usageCount: s.totalUses }))
    .sort((a, b) => b.usageCount - a.usageCount);

  return {
    totalChains,
    averageChainLength,
    retryCount: totalRetries,
    simulationAccuracy: 0.85, // placeholder — would compare predictions to actuals
    failureRate: Math.round(failureRate * 100) / 100,
    recoveryRate: Math.round(recoveryRate * 100) / 100,
    optimizationScore: Math.round(optimizationScore * 100) / 100,
    toolUsage,
  };
}
