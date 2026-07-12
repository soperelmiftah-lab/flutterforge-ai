/**
 * @module features/planner/router
 *
 * Agent Router — automatically chooses which agent should handle each task
 * based on the task's required tools, complexity, and the agent's
 * capabilities.
 */

import type { Task, AgentDescriptor, IntentType } from "../types";
import { agents } from "../registry";

/** Intent → preferred agent category mapping. */
const INTENT_AGENT_MAP: Record<IntentType, string[]> = {
  question: ["agent.planner"],
  "bug-fix": ["agent.debug", "agent.planner"],
  "feature-request": ["agent.flutter", "agent.riverpod", "agent.ui"],
  refactor: ["agent.flutter", "agent.review"],
  "code-review": ["agent.review", "agent.security"],
  "generate-ui": ["agent.ui", "agent.flutter"],
  "generate-api": ["agent.api", "agent.backend"],
  "generate-database": ["agent.database", "agent.supabase"],
  "generate-flutter-app": ["agent.flutter", "agent.ui"],
  "analyze-project": ["agent.planner", "agent.review"],
  "explain-code": ["agent.planner", "agent.docs"],
  documentation: ["agent.docs"],
  testing: ["agent.testing"],
  deployment: ["agent.deployment"],
};

/** Route a single task to the best agent. */
export function routeTask(task: Task, intentType?: IntentType): AgentDescriptor | undefined {
  const candidates = intentType ? INTENT_AGENT_MAP[intentType] ?? [] : [];

  // 1. Try intent-preferred agents that have the required tools.
  for (const agentId of candidates) {
    const agent = agents.find((a) => a.id === agentId);
    if (agent && agent.status === "idle" && hasRequiredTools(agent, task)) {
      return agent;
    }
  }

  // 2. Find any agent that has all required tools.
  const capable = agents.filter(
    (a) => a.status === "idle" && hasRequiredTools(a, task)
  );
  if (capable.length > 0) {
    // Prefer by priority: high > normal > low.
    const priorityOrder = { high: 0, normal: 1, low: 2, critical: 0 };
    capable.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    return capable[0];
  }

  // 3. Fallback: the planner agent.
  return agents.find((a) => a.id === "agent.planner");
}

/** Route all tasks in a plan. Returns a map of taskId → agentId. */
export function routeTasks(tasks: Task[], intentType?: IntentType): Record<string, string> {
  const routing: Record<string, string> = {};
  for (const task of tasks) {
    const agent = routeTask(task, intentType);
    if (agent) routing[task.id] = agent.id;
  }
  return routing;
}

/** Check if an agent has all the tools a task requires. */
function hasRequiredTools(agent: AgentDescriptor, task: Task): boolean {
  if (task.requiredTools.length === 0) return true;
  return task.requiredTools.every((toolId) => agent.allowedTools.includes(toolId));
}

/** Get the intent → agent mapping (for UI). */
export function getIntentAgentMap(): Record<IntentType, string[]> {
  return INTENT_AGENT_MAP;
}
