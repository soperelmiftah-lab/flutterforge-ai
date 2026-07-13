/**
 * @module features/tool-intelligence/capabilities
 *
 * Capability Analyzer — analyzes a task, the workspace, and available tools
 * to determine what capabilities are needed and which tools can provide them.
 */

import type { CapabilityAnalysis } from "../types";
import type { IntentType } from "@/features/planner/types";
import type { ToolDescriptor } from "@/features/execution/types";
import { listTools } from "@/features/execution/registry";

/** Capability requirements per intent type. */
const INTENT_CAPABILITIES: Record<IntentType, string[]> = {
  question: ["search", "read"],
  "bug-fix": ["search", "read", "write", "analyze"],
  "feature-request": ["create", "write", "search", "test"],
  refactor: ["read", "write", "analyze", "search"],
  "code-review": ["read", "search", "analyze"],
  "generate-ui": ["create", "write", "search"],
  "generate-api": ["create", "write", "search"],
  "generate-database": ["create", "write", "search"],
  "generate-flutter-app": ["create", "write", "directory"],
  "analyze-project": ["list", "search", "read", "analyze"],
  "explain-code": ["read", "search"],
  documentation: ["read", "write", "search"],
  testing: ["create", "write", "test", "search"],
  deployment: ["build", "deploy"],
};

/** Map a tool to its capabilities. */
function toolCapabilities(tool: ToolDescriptor): string[] {
  const caps: string[] = [];
  if (tool.id.includes("read") || tool.id.includes("list")) caps.push("read", "list");
  if (tool.id.includes("write") || tool.id.includes("create") || tool.id.includes("insert") || tool.id.includes("replace")) caps.push("write", "create");
  if (tool.id.includes("delete")) caps.push("delete");
  if (tool.id.includes("search") || tool.id.includes("find")) caps.push("search");
  if (tool.id.includes("directory") || tool.id.includes("directory")) caps.push("directory");
  if (tool.id.includes("analyze")) caps.push("analyze");
  if (tool.id.includes("test")) caps.push("test");
  if (tool.id.includes("build")) caps.push("build", "deploy");
  if (tool.id.includes("format")) caps.push("format");
  return caps;
}

/** Analyze the capabilities needed for a task. */
export function analyzeCapabilities(
  taskId: string,
  intentType: IntentType,
  requiredFiles: string[] = []
): CapabilityAnalysis {
  const requiredCapabilities = INTENT_CAPABILITIES[intentType] ?? ["search", "read"];
  const allTools = listTools();
  const availableTools = allTools.filter((t) => t.implemented);

  // Check which capabilities are covered by available tools.
  const coveredCapabilities = new Set<string>();
  for (const tool of availableTools) {
    for (const cap of toolCapabilities(tool)) {
      coveredCapabilities.add(cap);
    }
  }

  const gaps = requiredCapabilities.filter((c) => !coveredCapabilities.has(c));

  // Determine available agents (from planner registry — just count categories).
  const availableAgents = availableTools.map((t) => t.category);

  return {
    taskId,
    intentType,
    requiredCapabilities,
    availableTools,
    availableAgents,
    requiredFiles,
    workspaceReady: gaps.length === 0,
    gaps,
  };
}

/** Get the capability map for a tool. */
export function getToolCapabilities(tool: ToolDescriptor): string[] {
  return toolCapabilities(tool);
}
