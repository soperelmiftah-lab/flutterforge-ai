/**
 * @module features/tool-intelligence/cost
 *
 * Cost Estimator — estimates execution time, CPU, memory, tokens, workspace
 * changes, patch count, and monetary cost for a tool chain.
 */

import type { CostEstimate, ChainStep } from "../types";
import type { ToolDescriptor } from "@/features/execution/types";

/** Estimate the cost of a single tool. */
export function estimateToolCost(tool: ToolDescriptor): {
  timeMs: number;
  cpu: "low" | "medium" | "high";
  memory: "low" | "medium" | "high";
  tokens: number;
  monetary: number;
} {
  const cpuMap: Record<string, "low" | "medium" | "high"> = {
    safe: "low",
    moderate: "medium",
    high: "high",
    critical: "high",
  };
  return {
    timeMs: tool.timeoutMs,
    cpu: cpuMap[tool.riskLevel] ?? "low",
    memory: tool.category === "flutter" && tool.id.includes("build") ? "high" : "low",
    tokens: tool.category === "search" ? 200 : tool.category === "filesystem" ? 100 : 500,
    monetary: 0,
  };
}

/** Estimate the total cost of a tool chain. */
export function estimateChainCost(steps: ChainStep[]): CostEstimate {
  let executionTimeMs = 0;
  let tokenUsage = 0;
  let workspaceChanges = 0;
  let patchCount = 0;
  let maxCpu: "low" | "medium" | "high" = "low";
  let maxMemory: "low" | "medium" | "high" = "low";
  let monetaryCost = 0;

  const cpuRank = { low: 0, medium: 1, high: 2 };

  for (const step of steps) {
    executionTimeMs += step.estimatedDurationMs;
    tokenUsage += step.estimatedTokens;

    if (step.toolId.startsWith("fs.") && (step.toolId.includes("write") || step.toolId.includes("create") || step.toolId.includes("delete"))) {
      workspaceChanges++;
      patchCount++;
    }
    if (step.toolId.startsWith("editor.")) {
      patchCount++;
    }
  }

  // For parallel groups, take max instead of sum.
  const parallelGroups = new Map<string, ChainStep[]>();
  for (const step of steps) {
    if (step.parallelGroup) {
      if (!parallelGroups.has(step.parallelGroup)) parallelGroups.set(step.parallelGroup, []);
      parallelGroups.get(step.parallelGroup)!.push(step);
    }
  }
  for (const group of parallelGroups.values()) {
    const groupTime = Math.max(...group.map((s) => s.estimatedDurationMs));
    const sumTime = group.reduce((sum, s) => sum + s.estimatedDurationMs, 0);
    executionTimeMs -= (sumTime - groupTime);
  }

  return {
    executionTimeMs,
    cpuUsage: maxCpu,
    memoryUsage: maxMemory,
    tokenUsage,
    workspaceChanges,
    patchCount,
    monetaryCost,
  };
}

/** Format cost for display. */
export function formatCost(cost: CostEstimate): string {
  const time = cost.executionTimeMs < 1000
    ? `${cost.executionTimeMs}ms`
    : cost.executionTimeMs < 60000
      ? `${(cost.executionTimeMs / 1000).toFixed(1)}s`
      : `${(cost.executionTimeMs / 60000).toFixed(1)}m`;
  return `${time} · ${cost.tokenUsage} tokens · ${cost.patchCount} patches`;
}
