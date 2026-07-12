/**
 * @module features/planner/orchestrator
 *
 * Orchestrator — coordinates all agents. NEVER executes tools directly
 * (that's the Execution Engine's job). Only dispatches work, tracks
 * progress, and handles retries/timeouts.
 */

import type { Plan, Task } from "../types";
import { scheduler } from "../scheduler";
import { emitTimeline } from "../timeline";
import { evaluatePlan } from "../evaluation";
import type { ExecutionResult } from "@/features/execution/types";

/** Execute a plan (dispatch tasks, track progress). */
export async function executePlan(
  plan: Plan,
  options?: { onProgress?: (task: Task, result: ExecutionResult) => void }
): Promise<{ plan: Plan; results: Map<string, ExecutionResult> }> {
  plan.status = "executing";
  const results = new Map<string, ExecutionResult>();

  // Mark ready tasks.
  updateTaskStatuses(plan);

  while (true) {
    const batch = scheduler.nextBatch(plan.tasks, plan.strategy);
    if (batch.length === 0) {
      // Check if anything is still running.
      if (scheduler.runningCount() === 0) break;
      await sleep(100);
      continue;
    }

    // Dispatch the batch.
    await Promise.all(
      batch.map(async (task) => {
        scheduler.start(task.id);
        task.status = "running";
        task.startedAt = new Date().toISOString();
        emitTimeline("task-started", `Started: ${task.title}`, task.id, task.assignedAgentId);

        // In Phase 5, we don't actually execute tools — we simulate success.
        // The real execution happens via the Execution Engine in a future phase
        // when agents are implemented.
        const result: ExecutionResult = await simulateExecution(task);

        task.status = result.status === "success" ? "completed" : "failed";
        task.progress = 100;
        task.actualDurationMs = result.durationMs;
        task.completedAt = new Date().toISOString();
        task.result = result.output;
        task.error = result.error;

        scheduler.complete(task.id);
        results.set(task.id, result);

        if (task.status === "completed") {
          emitTimeline("task-completed", `Completed: ${task.title}`, task.id, task.assignedAgentId);
        } else {
          emitTimeline("task-failed", `Failed: ${task.title} — ${result.error}`, task.id, task.assignedAgentId);
        }

        options?.onProgress?.(task, result);
        updateTaskStatuses(plan);
      })
    );
  }

  // Evaluate the plan.
  const allCompleted = plan.tasks.every((t) => t.status === "completed");
  plan.status = allCompleted ? "completed" : "failed";

  return { plan, results };
}

/** Update task statuses based on dependency completion. */
function updateTaskStatuses(plan: Plan): void {
  for (const task of plan.tasks) {
    if (task.status !== "pending") continue;
    const depsComplete = task.dependsOn.every((depId) => {
      const dep = plan.tasks.find((t) => t.id === depId);
      return dep && dep.status === "completed";
    });
    if (depsComplete) {
      task.status = "ready";
    } else {
      task.status = "blocked";
    }
  }
}

/** Simulate task execution (Phase 5 placeholder). */
async function simulateExecution(task: Task): Promise<ExecutionResult> {
  const start = Date.now();
  // Simulate variable duration.
  await sleep(Math.min(task.estimatedDurationMs, 500));
  return {
    requestId: `sim_${task.id}`,
    status: "success",
    output: { simulated: true, task: task.title },
    durationMs: Date.now() - start,
    finishedAt: new Date().toISOString(),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void evaluatePlan;
