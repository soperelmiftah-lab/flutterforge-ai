/**
 * @module features/tool-intelligence/selector
 *
 * Tool Selector — automatically chooses the best tools for a task based on
 * 7 criteria: capability, safety, performance, token cost, reliability, risk.
 */

import type { ToolSelection, SelectionCriteria } from "../types";
import type { ToolDescriptor } from "@/features/execution/types";
import { getToolDescriptor, listTools } from "@/features/execution/registry";
import { analyzeToolRisk } from "../risk";

/** Select the best tool for a given capability. */
export function selectTool(
  capability: string,
  context?: { preferSafety?: boolean; preferSpeed?: boolean }
): ToolSelection | null {
  const candidates = listTools().filter((t) => {
    const caps = getToolCapabilitiesForTool(t);
    return caps.includes(capability) && t.implemented;
  });

  if (candidates.length === 0) return null;

  const scored = candidates.map((tool) => {
    const criteria = scoreTool(tool, context);
    return { tool, criteria, score: overallScore(criteria) };
  });

  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];

  return {
    toolId: best.tool.id,
    toolName: best.tool.name,
    score: Math.round(best.score * 100) / 100,
    criteria: best.criteria,
    rationale: buildRationale(best.tool, best.criteria),
    alternatives: scored.slice(1, 4).map((s) => s.tool.id),
  };
}

/** Score a tool across all criteria. */
function scoreTool(tool: ToolDescriptor, context?: { preferSafety?: boolean; preferSpeed?: boolean }): SelectionCriteria {
  const risk = analyzeToolRisk(tool);

  const safety = 1 - risk;
  const performance = Math.max(0.2, 1 - (tool.timeoutMs / 600000)); // shorter timeout = faster
  const tokenCost = tool.category === "search" ? 0.9 : tool.category === "filesystem" ? 0.8 : 0.5;
  const reliability = tool.implemented ? 0.8 : 0.3;
  const capability = 1.0; // already filtered by capability

  // Adjust based on preferences.
  let safetyWeight = 1;
  let performanceWeight = 1;
  if (context?.preferSafety) safetyWeight = 1.5;
  if (context?.preferSpeed) performanceWeight = 1.5;

  return {
    capability,
    safety: Math.min(1, safety * safetyWeight),
    performance: Math.min(1, performance * performanceWeight),
    tokenCost,
    reliability,
    risk,
  };
}

/** Compute overall score from criteria. */
function overallScore(c: SelectionCriteria): number {
  const weights = {
    capability: 0.20,
    safety: 0.25,
    performance: 0.15,
    tokenCost: 0.15,
    reliability: 0.15,
    risk: 0.10,
  };
  return (
    c.capability * weights.capability +
    c.safety * weights.safety +
    c.performance * weights.performance +
    c.tokenCost * weights.tokenCost +
    c.reliability * weights.reliability +
    (1 - c.risk) * weights.risk
  );
}

/** Build a human-readable rationale. */
function buildRationale(tool: ToolDescriptor, criteria: SelectionCriteria): string {
  const reasons: string[] = [];
  if (criteria.safety > 0.8) reasons.push("high safety");
  if (criteria.performance > 0.7) reasons.push("fast execution");
  if (criteria.tokenCost > 0.8) reasons.push("low token cost");
  if (criteria.reliability > 0.7) reasons.push("reliable");
  if (reasons.length === 0) reasons.push("best available match");
  return `${tool.name} selected for ${reasons.join(", ")}.`;
}

/** Get capabilities for a tool (reused from capabilities module). */
function getToolCapabilitiesForTool(tool: ToolDescriptor): string[] {
  const caps: string[] = [];
  if (tool.id.includes("read") || tool.id.includes("list")) caps.push("read", "list");
  if (tool.id.includes("write") || tool.id.includes("create") || tool.id.includes("insert") || tool.id.includes("replace")) caps.push("write", "create");
  if (tool.id.includes("delete")) caps.push("delete");
  if (tool.id.includes("search") || tool.id.includes("find")) caps.push("search");
  if (tool.id.includes("analyze")) caps.push("analyze");
  if (tool.id.includes("test")) caps.push("test");
  if (tool.id.includes("build")) caps.push("build", "deploy");
  if (tool.id.includes("format")) caps.push("format");
  return caps;
}

/** Select multiple tools for multiple capabilities. */
export function selectTools(capabilities: string[]): ToolSelection[] {
  return capabilities
    .map((cap) => selectTool(cap))
    .filter((s): s is ToolSelection => s !== null);
}

void getToolDescriptor;
