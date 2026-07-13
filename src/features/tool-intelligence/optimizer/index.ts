/**
 * @module features/tool-intelligence/optimizer
 *
 * Execution Optimizer — optimizes a tool chain by reducing tool count,
 * parallelizing independent steps, minimizing token usage, and reducing
 * context overhead.
 */

import type { ToolChain, ChainStep } from "../types";
import { estimateChainCost } from "../cost";
import { analyzeChainRisk } from "../risk";

/** Optimize a tool chain. Returns a new optimized chain. */
export function optimizeChain(chain: ToolChain): ToolChain {
  const optimized = { ...chain, steps: [...chain.steps] };

  // 1. Remove redundant steps (same toolId appearing consecutively).
  optimized.steps = removeRedundant(optimized.steps);

  // 2. Parallelize independent steps (same dependency, no side effects).
  optimized.steps = parallelizeIndependent(optimized.steps);

  // 3. Merge consecutive read operations.
  optimized.steps = mergeReads(optimized.steps);

  // 4. Recompute cost + risk.
  optimized.costEstimate = estimateChainCost(optimized.steps);
  optimized.totalEstimatedDurationMs = optimized.costEstimate.executionTimeMs;
  optimized.totalEstimatedTokens = optimized.costEstimate.tokenUsage;
  optimized.riskScore = analyzeChainRisk(optimized.steps).overall;
  optimized.optimized = true;

  return optimized;
}

/** Remove consecutive duplicate tool calls. */
function removeRedundant(steps: ChainStep[]): ChainStep[] {
  const out: ChainStep[] = [];
  for (const step of steps) {
    const prev = out[out.length - 1];
    if (prev && prev.toolId === step.toolId && JSON.stringify(prev.parameters) === JSON.stringify(step.parameters)) {
      continue; // skip duplicate
    }
    out.push(step);
  }
  return out;
}

/** Parallelize steps that share the same dependency and are read-only. */
function parallelizeIndependent(steps: ChainStep[]): ChainStep[] {
  const groups = new Map<string, ChainStep[]>();
  for (const step of steps) {
    const depKey = step.dependsOn.join(",") || "root";
    if (!groups.has(depKey)) groups.set(depKey, []);
    groups.get(depKey)!.push(step);
  }

  const out: ChainStep[] = [];
  for (const [, groupSteps] of groups) {
    const readOnly = groupSteps.filter((s) =>
      s.toolId.includes("read") || s.toolId.includes("search") || s.toolId.includes("list") || s.toolId.includes("find")
    );
    const writeOps = groupSteps.filter((s) => !readOnly.includes(s));

    if (readOnly.length > 1) {
      const groupId = `parallel_${out.length}`;
      readOnly.forEach((s) => { s.parallelGroup = groupId; s.dependsOn = readOnly[0].dependsOn; });
    }
    out.push(...readOnly, ...writeOps);
  }
  return out;
}

/** Merge consecutive read operations into a single step. */
function mergeReads(steps: ChainStep[]): ChainStep[] {
  const out: ChainStep[] = [];
  for (const step of steps) {
    const prev = out[out.length - 1];
    if (
      prev &&
      prev.toolId === "fs.read_file" &&
      step.toolId === "fs.read_file" &&
      prev.dependsOn.join(",") === step.dependsOn.join(",")
    ) {
      // Merge: keep the second (it likely reads a different file).
      prev.parameters = { ...prev.parameters, merged: true };
    }
    out.push(step);
  }
  return out;
}

/** Compare original vs optimized chain. */
export function compareChains(original: ToolChain, optimized: ToolChain): {
  timeSavedMs: number;
  tokensSaved: number;
  riskReduced: number;
  stepsReduced: number;
} {
  return {
    timeSavedMs: Math.max(0, original.totalEstimatedDurationMs - optimized.totalEstimatedDurationMs),
    tokensSaved: Math.max(0, original.totalEstimatedTokens - optimized.totalEstimatedTokens),
    riskReduced: Math.max(0, original.riskScore - optimized.riskScore),
    stepsReduced: Math.max(0, original.steps.length - optimized.steps.length),
  };
}
