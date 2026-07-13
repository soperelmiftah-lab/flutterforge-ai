/**
 * @module features/planner/memory
 *
 * Planner Memory — stores historical planning data for learning and
 * improvement. In Phase 5 this is in-memory; future phases persist it.
 */

import type { PlannerMemory, IntentType } from "../types";

let memory: PlannerMemory = {
  pastPlans: [],
  workflowHistory: [],
  agentPerformance: [],
  planningAccuracy: [],
};

/** Record a completed plan. */
export function recordPlan(intentType: IntentType, planId: string, successRate: number): void {
  memory.pastPlans.push({ intentType, planId, successRate });
  if (memory.pastPlans.length > 100) memory.pastPlans.shift();
}

/** Record a workflow usage. */
export function recordWorkflow(workflowId: string, success: boolean): void {
  memory.workflowHistory.push({ workflowId, usedAt: new Date().toISOString(), success });
  if (memory.workflowHistory.length > 100) memory.workflowHistory.shift();
}

/** Record agent performance. */
export function recordAgentPerformance(agentId: string, durationMs: number, success: boolean): void {
  const existing = memory.agentPerformance.find((a) => a.agentId === agentId);
  if (existing) {
    // Running average.
    existing.avgDurationMs = Math.round((existing.avgDurationMs + durationMs) / 2);
    existing.successRate = (existing.successRate + (success ? 1 : 0)) / 2;
  } else {
    memory.agentPerformance.push({
      agentId,
      avgDurationMs: durationMs,
      successRate: success ? 1 : 0,
    });
  }
}

/** Record planning accuracy (estimated vs actual). */
export function recordAccuracy(accuracy: number): void {
  memory.planningAccuracy.push(accuracy);
  if (memory.planningAccuracy.length > 50) memory.planningAccuracy.shift();
}

/** Get the full memory. */
export function getMemory(): PlannerMemory {
  return memory;
}

/** Get past plans for a given intent type. */
export function getPastPlans(intentType: IntentType): PlannerMemory["pastPlans"] {
  return memory.pastPlans.filter((p) => p.intentType === intentType);
}

/** Get agent performance. */
export function getAgentPerformance(agentId: string): { avgDurationMs: number; successRate: number } | undefined {
  return memory.agentPerformance.find((a) => a.agentId === agentId);
}

/** Clear all memory. */
export function clearMemory(): void {
  memory = {
    pastPlans: [],
    workflowHistory: [],
    agentPerformance: [],
    planningAccuracy: [],
  };
}
