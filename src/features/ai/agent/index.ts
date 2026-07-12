/**
 * @module features/ai/agent
 *
 * The AI Coding Agent. Planned responsibilities (Phase 2):
 *  - Turn natural-language requests into structured file edits
 *  - Maintain project context (open files, dependency graph, conventions)
 *  - Stream progress + partial diffs over WebSocket
 *  - Delegate to specialized sub-agents (debug, review) via AgentManager
 *
 * This module is intentionally a contract-only stub in Phase 1.
 */

export type AgentRole = "coder" | "reviewer" | "debugger" | "planner";

export interface AgentRequest {
  id: string;
  role: AgentRole;
  prompt: string;
  context?: {
    openFiles?: string[];
    selection?: string;
    projectId?: string;
  };
}

export interface AgentResponse {
  id: string;
  requestId: string;
  status: "streaming" | "complete" | "error";
  /** Streamed partial deltas (text + tool calls). */
  deltas?: AgentDelta[];
  /** Final structured result when status === "complete". */
  result?: AgentResult;
}

export interface AgentDelta {
  type: "text" | "file_edit" | "tool_call";
  content: string;
}

export interface AgentResult {
  message: string;
  edits: Array<{ path: string; patch: string }>;
  toolsUsed: string[];
}

/**
 * Run an agent request. NOT IMPLEMENTED in Phase 1.
 * Phase 2 wires this to the model manager + streaming transport.
 */
export async function runAgent(_request: AgentRequest): Promise<AgentResponse> {
  throw new Error(
    "AI agent is not implemented in Phase 1. Arrives in Phase 2 — see docs/roadmap."
  );
}

/** Cancel an in-flight agent run. Stub. */
export async function cancelAgent(_requestId: string): Promise<void> {
  throw new Error("cancelAgent: not implemented in Phase 1.");
}
