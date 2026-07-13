/**
 * @module features/tool-intelligence/simulation
 *
 * Simulation Engine — dry-run mode that never modifies the project. Predicts
 * tool outputs, patch results, execution duration, risk, and resource usage.
 */

import type { SimulationResult, ToolChain, ChainStep } from "../types";
import type { ToolDescriptor } from "@/features/execution/types";
import { getToolDescriptor } from "@/features/execution/registry";

/** Simulate a tool chain (dry run — never modifies anything). */
export function simulateChain(chain: ToolChain): SimulationResult {
  const predictedOutputs: SimulationResult["predictedOutputs"] = [];
  const predictedPatches: SimulationResult["predictedPatches"] = [];
  const warnings: string[] = [];
  const approvalSteps: string[] = [];

  let predictedDurationMs = 0;
  let predictedTokens = 0;

  for (const step of chain.steps) {
    const tool = getToolDescriptor(step.toolId);
    if (!tool) {
      warnings.push(`Step ${step.id}: unknown tool`);
      continue;
    }

    predictedDurationMs += step.estimatedDurationMs;
    predictedTokens += step.estimatedTokens;

    // Predict output.
    predictedOutputs.push({
      stepId: step.id,
      toolId: step.toolId,
      predictedOutput: predictOutput(step, tool),
    });

    // Predict patches for write operations.
    if (step.toolId.includes("write") || step.toolId.includes("create") || step.toolId.includes("insert") || step.toolId.includes("replace")) {
      predictedPatches.push({
        stepId: step.id,
        path: (step.parameters.path as string) ?? "unknown",
        linesAdded: predictLinesAdded(step, tool),
        linesRemoved: predictLinesRemoved(step, tool),
      });
    }

    // Check approval requirements.
    if (step.requiresApproval) {
      approvalSteps.push(step.id);
    }

    // Check for potential issues.
    if (!tool.implemented) {
      warnings.push(`Step ${step.id}: "${tool.name}" is not implemented — execution will fail`);
    }
    if (step.fallbacks.length === 0 && tool.riskLevel !== "safe") {
      warnings.push(`Step ${step.id}: risky operation with no fallback`);
    }
  }

  // Adjust for parallel groups (take max time, not sum).
  const parallelGroups = new Map<string, ChainStep[]>();
  for (const step of chain.steps) {
    if (step.parallelGroup) {
      if (!parallelGroups.has(step.parallelGroup)) parallelGroups.set(step.parallelGroup, []);
      parallelGroups.get(step.parallelGroup)!.push(step);
    }
  }
  for (const group of parallelGroups.values()) {
    const sumTime = group.reduce((sum, s) => sum + s.estimatedDurationMs, 0);
    const maxTime = Math.max(...group.map((s) => s.estimatedDurationMs));
    predictedDurationMs -= (sumTime - maxTime);
  }

  return {
    chainId: chain.id,
    dryRun: true,
    predictedOutputs,
    predictedPatches,
    predictedDurationMs,
    predictedTokens,
    predictedRisk: chain.riskScore,
    approvalRequired: approvalSteps.length > 0,
    approvalSteps,
    warnings,
    success: warnings.filter((w) => w.includes("not implemented")).length === 0,
    simulatedAt: new Date().toISOString(),
  };
}

/** Predict the output of a tool. */
function predictOutput(step: ChainStep, tool: ToolDescriptor): string {
  switch (tool.category) {
    case "filesystem":
      if (tool.id.includes("read")) return "File content (predicted)";
      if (tool.id.includes("list")) return "Directory listing (predicted)";
      if (tool.id.includes("write") || tool.id.includes("create")) return "File created/modified (predicted)";
      if (tool.id.includes("delete")) return "File deleted (predicted)";
      return "Filesystem operation (predicted)";
    case "search":
      return "Search results (predicted)";
    case "flutter":
      return "Flutter command output (predicted)";
    case "git":
      return "Git command output (predicted)";
    case "terminal":
      return "Terminal output (predicted)";
    default:
      return "Tool output (predicted)";
  }
}

/** Predict lines added by a write operation. */
function predictLinesAdded(step: ChainStep, tool: ToolDescriptor): number {
  const content = step.parameters.content as string | undefined;
  if (content) return content.split("\n").length;
  if (tool.id.includes("insert")) return 5;
  if (tool.id.includes("create")) return 10;
  return 1;
}

/** Predict lines removed by a write operation. */
function predictLinesRemoved(_step: ChainStep, tool: ToolDescriptor): number {
  if (tool.id.includes("delete")) return 100;
  if (tool.id.includes("replace")) return 3;
  return 0;
}

/** Simulate a single step. */
export function simulateStep(step: ChainStep): {
  predictedSuccess: boolean;
  predictedDurationMs: number;
  predictedOutput: string;
  warnings: string[];
} {
  const tool = getToolDescriptor(step.toolId);
  return {
    predictedSuccess: tool?.implemented ?? false,
    predictedDurationMs: step.estimatedDurationMs,
    predictedOutput: tool ? predictOutput(step, tool) : "Unknown tool",
    warnings: tool && !tool.implemented ? ["Tool not implemented"] : [],
  };
}
