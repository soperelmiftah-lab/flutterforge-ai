/**
 * @module features/planner/core
 *
 * The Planner — the central plan() API. Converts a user request into a
 * structured Plan (goal → objectives → tasks → graph → strategy → agents).
 *
 * Pipeline:
 *   1. detectIntent(input)
 *   2. createGoal(intent)
 *   3. buildTasks(goal)
 *   4. buildGraph(tasks)
 *   5. chooseStrategy(tasks, intent)
 *   6. routeTasks(tasks, intent)
 *   7. assemble Plan
 */

import type { Plan, Intent, Goal, Task, TaskGraph, ExecutionStrategy } from "./types";
import { detectIntent } from "./intent";
import { createGoal } from "./goals";
import { buildTasks, estimateDuration } from "./tasks";
import { buildGraph } from "./graph";
import { chooseStrategy } from "./strategy";
import { routeTasks } from "./router";
import { uid } from "@/lib/utils";

/** The central plan() API. Converts input → Plan. */
export function plan(input: string): { intent: Intent; goal: Goal; plan: Plan } {
  // 1. Detect intent.
  const intent = detectIntent(input);

  // 2. Create goal.
  const goal = createGoal(intent);

  // 3. Build tasks.
  const tasks = buildTasks(goal);

  // 4. Build graph.
  const graph = buildGraph(tasks);

  // 5. Choose strategy.
  const strategy = chooseStrategy(tasks, intent.type);

  // 6. Route tasks to agents.
  const routing = routeTasks(tasks, intent.type);
  const requiredAgents = Array.from(new Set(Object.values(routing)));
  for (const task of tasks) {
    task.assignedAgentId = routing[task.id];
  }

  // 7. Assemble plan.
  const estimatedDurationMs = estimateDuration(tasks);
  const estimatedTokens = estimateTokens(tasks);

  const thePlan: Plan = {
    id: uid("plan"),
    goalId: goal.id,
    intentType: intent.type,
    tasks,
    graph,
    strategy,
    requiredAgents,
    estimatedDurationMs,
    estimatedTokens,
    status: "draft",
    createdAt: new Date().toISOString(),
  };

  return { intent, goal, plan: thePlan };
}

/** Estimate token usage for a plan (rough heuristic). */
function estimateTokens(tasks: Task[]): number {
  // ~500 tokens per task for context + reasoning.
  return tasks.length * 500;
}

/** Get a plan summary for display. */
export function planSummary(plan: Plan): {
  taskCount: number;
  agentCount: number;
  estimatedDurationLabel: string;
  strategy: string;
  complexity: string;
} {
  const totalMs = plan.estimatedDurationMs;
  const label =
    totalMs < 60000 ? `${(totalMs / 1000).toFixed(1)}s` :
    totalMs < 3600000 ? `${(totalMs / 60000).toFixed(1)}m` :
    `${(totalMs / 3600000).toFixed(1)}h`;

  const complexityScores = plan.tasks.map((t) =>
    t.complexity === "trivial" ? 1 :
    t.complexity === "simple" ? 2 :
    t.complexity === "moderate" ? 3 :
    t.complexity === "complex" ? 4 : 5
  );
  const avgComplexity = complexityScores.reduce((a, b) => a + b, 0) / complexityScores.length;
  const complexity =
    avgComplexity < 1.5 ? "Trivial" :
    avgComplexity < 2.5 ? "Simple" :
    avgComplexity < 3.5 ? "Moderate" :
    avgComplexity < 4.5 ? "Complex" : "Very Complex";

  return {
    taskCount: plan.tasks.length,
    agentCount: plan.requiredAgents.length,
    estimatedDurationLabel: label,
    strategy: plan.strategy.kind,
    complexity,
  };
}
