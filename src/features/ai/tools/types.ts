/**
 * @module features/ai/tools/types
 *
 * Tool calling contracts. Tools let the model invoke functions (read a file,
 * run a build, search docs) during a chat completion. Phase 2 defines the
 * types only — the tool registry and execution engine arrive in Phase 3+
 * when the AI Agent is built.
 */

import type { ToolDefinition, ToolCall } from "@/features/ai/chat/types";

/** A tool that the model can call. */
export interface AITool {
  /** The tool definition sent to the model. */
  definition: ToolDefinition;
  /** Execute the tool when the model calls it. */
  execute: (args: Record<string, unknown>) => Promise<ToolResult>;
}

/** Result of executing a tool. */
export interface ToolResult {
  toolCallId: string;
  success: boolean;
  /** Text result returned to the model. */
  output: string;
  /** Optional structured data (for the UI). */
  data?: unknown;
  /** Error message if success is false. */
  error?: string;
}

/** The tool registry contract (implemented in Phase 3). */
export interface ToolRegistry {
  register(tool: AITool): void;
  unregister(name: string): void;
  list(): AITool[];
  definitions(): ToolDefinition[];
  execute(call: ToolCall): Promise<ToolResult>;
}

/** Built-in tool names reserved for future phases. */
export const RESERVED_TOOL_NAMES = [
  "read_file",
  "write_file",
  "list_files",
  "run_build",
  "run_preview",
  "search_docs",
  "create_project",
  "git_commit",
] as const;
