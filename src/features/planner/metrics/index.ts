/**
 * @module features/planner/metrics
 *
 * Metrics — aggregates planner performance over time.
 */

import type { PlannerMetrics } from "../types";
import { listSessions } from "../sessions";
import { getMemory } from "../memory";
import { agents } from "../registry";

/** Compute current planner metrics. */
export function computeMetrics(): PlannerMetrics {
  const sessions = listSessions();
  const memory = getMemory();
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const averagePlanningTimeMs = completedSessions.length > 0
    ? Math.round(
        completedSessions.reduce((sum, s) => {
          const created = new Date(s.createdAt).getTime();
          const updated = new Date(s.updatedAt).getTime();
          return sum + (updated - created);
        }, 0) / completedSessions.length
      )
    : 0;

  const allPlans = completedSessions.filter((s) => s.plan);
  const averageTaskCount = allPlans.length > 0
    ? Math.round(allPlans.reduce((sum, s) => sum + (s.plan!.tasks.length), 0) / allPlans.length)
    : 0;

  const agentUtilization = agents.map((a) => {
    const taskCount = allPlans.reduce(
      (sum, s) => sum + s.plan!.tasks.filter((t) => t.assignedAgentId === a.id).length,
      0
    );
    const totalTasks = allPlans.reduce((sum, s) => sum + s.plan!.tasks.length, 0);
    return {
      agentId: a.id,
      utilization: totalTasks > 0 ? taskCount / totalTasks : 0,
      taskCount,
    };
  });

  const workflowSuccessRate = memory.workflowHistory.length > 0
    ? memory.workflowHistory.filter((w) => w.success).length / memory.workflowHistory.length
    : 0;

  const planningAccuracy = memory.planningAccuracy.length > 0
    ? memory.planningAccuracy.reduce((a, b) => a + b, 0) / memory.planningAccuracy.length
    : 0;

  const retryCount = allPlans.reduce(
    (sum, s) => sum + s.plan!.tasks.filter((t) => t.status === "failed").length,
    0
  );

  const executionSuccessRate = allPlans.length > 0
    ? allPlans.filter((s) => s.evaluation?.successRate === 1).length / allPlans.length
    : 0;

  return {
    averagePlanningTimeMs,
    averageTaskCount,
    agentUtilization,
    workflowSuccessRate,
    planningAccuracy,
    retryCount,
    executionSuccessRate,
    totalSessions: sessions.length,
    totalPlans: allPlans.length,
  };
}
