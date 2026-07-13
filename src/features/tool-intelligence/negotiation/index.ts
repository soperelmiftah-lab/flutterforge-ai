/**
 * @module features/tool-intelligence/negotiation
 *
 * Tool Negotiator — when multiple tools can solve the same objective, choose
 * the best based on speed, context, and availability.
 *
 * Example: `flutter analyze` vs `dart analyze` — choose based on which is
 * available and faster for the current context.
 */

import type { ToolNegotiationResult } from "../types";
import type { ToolDescriptor } from "@/features/execution/types";
import { listTools } from "@/features/execution/registry";

/** Negotiate the best tool for an objective. */
export function negotiateTool(objective: string, candidateToolIds: string[]): ToolNegotiationResult {
  const allTools = listTools();
  const candidates = candidateToolIds
    .map((id) => allTools.find((t) => t.id === id))
    .filter((t): t is ToolDescriptor => t !== undefined);

  if (candidates.length === 0) {
    return {
      objective,
      candidates: [],
      winner: "",
      rationale: "No candidates available",
    };
  }

  const scored = candidates.map((tool) => {
    const score = scoreForObjective(tool, objective);
    return { toolId: tool.id, score, reason: buildReason(tool, score) };
  });

  scored.sort((a, b) => b.score - a.score);
  const winner = scored[0];

  return {
    objective,
    candidates: scored,
    winner: winner.toolId,
    rationale: winner.reason,
  };
}

/** Score a tool for a given objective. */
function scoreForObjective(tool: ToolDescriptor, objective: string): number {
  let score = 0.5;

  // Speed: shorter timeout = faster.
  if (tool.timeoutMs < 10000) score += 0.2;
  else if (tool.timeoutMs < 30000) score += 0.1;
  else score -= 0.1;

  // Availability: implemented tools score higher.
  if (tool.implemented) score += 0.2;
  else score -= 0.3;

  // Safety: safer tools score higher.
  if (tool.riskLevel === "safe") score += 0.15;
  else if (tool.riskLevel === "moderate") score += 0.05;
  else score -= 0.1;

  // Context match: if the objective mentions the tool's category.
  const lowerObjective = objective.toLowerCase();
  if (lowerObjective.includes(tool.category)) score += 0.1;

  return Math.max(0, Math.min(1, score));
}

/** Build a human-readable reason. */
function buildReason(tool: ToolDescriptor, score: number): string {
  const reasons: string[] = [];
  if (tool.implemented) reasons.push("available");
  if (tool.riskLevel === "safe") reasons.push("safe");
  if (tool.timeoutMs < 10000) reasons.push("fast");
  if (reasons.length === 0) reasons.push("fallback option");
  return `${tool.name} (${reasons.join(", ")}) — score: ${(score * 100).toFixed(0)}%`;
}

/** Common negotiation scenarios. */
export const NEGOTIATION_SCENARIOS = [
  {
    objective: "Analyze Dart code",
    candidates: ["flutter.analyze", "search.find_symbol"],
    description: "Flutter analyze vs symbol search for code analysis",
  },
  {
    objective: "Read file content",
    candidates: ["fs.read_file", "search.find_text"],
    description: "Direct read vs text search for file content",
  },
  {
    objective: "Modify file",
    candidates: ["fs.write_file", "editor.replace_range", "editor.insert_text"],
    description: "Full rewrite vs targeted edit for file modification",
  },
  {
    objective: "Find a widget",
    candidates: ["search.find_widget", "search.find_symbol", "search.find_file"],
    description: "Widget search vs symbol search vs file search",
  },
] as const;
