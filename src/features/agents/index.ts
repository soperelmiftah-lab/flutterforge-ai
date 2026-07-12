/**
 * @module features/agents
 *
 * Agent Manager — orchestrates multiple specialized agents (coder, reviewer,
 * debugger, planner) and routes work between them. Planned (Phase 4):
 *  - Agent lifecycle (spawn, pause, resume, terminate)
 *  - Shared blackboard / context bus
 *  - Dependency-aware task scheduling
 *  - Human-in-the-loop checkpoints
 *
 * Phase 1: contract only.
 */

import type { AgentRole } from "@/features/ai/agent";

export interface AgentInstance {
  id: string;
  role: AgentRole;
  status: "idle" | "running" | "waiting" | "done" | "error";
  currentTaskId?: string;
}

export interface AgentTask {
  id: string;
  assignedTo: AgentRole;
  description: string;
  dependsOn: string[];
  status: "pending" | "running" | "done" | "failed";
  result?: unknown;
}

/** Spawn a new agent instance. NOT IMPLEMENTED in Phase 1. */
export async function spawnAgent(_role: AgentRole): Promise<AgentInstance> {
  throw new Error("Agent manager is not implemented in Phase 1. Arrives in Phase 4.");
}

/** Submit a task graph for execution. NOT IMPLEMENTED in Phase 1. */
export async function runTaskGraph(_tasks: AgentTask[]): Promise<AgentTask[]> {
  throw new Error("Multi-agent orchestration arrives in Phase 4.");
}

/** Currently registered agents. Empty in Phase 1. */
export const activeAgents: AgentInstance[] = [];
