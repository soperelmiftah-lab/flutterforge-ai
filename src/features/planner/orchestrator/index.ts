/**
 * @module features/planner/orchestrator
 *
 * Orchestrator — coordinates all agents. Dispatches work to agents,
 * tracks progress, and handles the full execution lifecycle.
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

  // Reset all task statuses to pending for a fresh run.
  for (const task of plan.tasks) {
    if (task.status === "completed" || task.status === "failed") {
      task.status = "pending";
      task.progress = 0;
      task.startedAt = undefined;
      task.completedAt = undefined;
      task.actualDurationMs = undefined;
      task.result = undefined;
      task.error = undefined;
    }
  }

  // Mark initial task statuses.
  updateTaskStatuses(plan);

  emitTimeline("workflow-started", `Executing plan: ${plan.tasks.length} tasks`);

  let maxIterations = 100; // Safety limit
  while (maxIterations-- > 0) {
    const batch = scheduler.nextBatch(plan.tasks, plan.strategy);
    if (batch.length === 0) {
      if (scheduler.runningCount() === 0) break;
      await sleep(50);
      continue;
    }

    // Dispatch the batch.
    await Promise.all(
      batch.map(async (task) => {
        scheduler.start(task.id);
        task.status = "running";
        task.startedAt = new Date().toISOString();
        emitTimeline("task-started", `Started: ${task.title}`, task.id, task.assignedAgentId);

        const result: ExecutionResult = await executeTask(task);

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
  const completedCount = plan.tasks.filter((t) => t.status === "completed").length;
  const allCompleted = completedCount === plan.tasks.length;
  plan.status = allCompleted ? "completed" : "failed";

  emitTimeline("workflow-completed", `Plan ${plan.status}: ${completedCount}/${plan.tasks.length} tasks completed`);

  return { plan, results };
}

/** Update task statuses based on dependency completion. */
function updateTaskStatuses(plan: Plan): void {
  for (const task of plan.tasks) {
    if (task.status !== "pending" && task.status !== "blocked") continue;
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

/** Execute a single task — simulates agent work with realistic output. */
async function executeTask(task: Task): Promise<ExecutionResult> {
  const start = Date.now();
  
  // Simulate execution time (cap at 300ms for responsiveness)
  const execTime = Math.min(task.estimatedDurationMs, 300);
  await sleep(execTime);

  // Generate realistic output based on task type and required tools
  const output = generateTaskOutput(task);
  const success = output !== null;

  return {
    requestId: `exec_${task.id}`,
    status: success ? "success" : "failed",
    output: output ?? undefined,
    error: success ? undefined : "Task execution failed",
    durationMs: Date.now() - start,
    finishedAt: new Date().toISOString(),
  };
}

/** Generate realistic task output based on the task's required tools. */
function generateTaskOutput(task: Task): unknown | null {
  // All tasks succeed in the simulation
  const toolOutputs: Record<string, unknown> = {
    "search.find_text": { matches: [{ path: "lib/main.dart", line: 24, content: "Column(children: [...])" }], count: 1 },
    "search.find_symbol": { results: [{ name: "HomeScreen", kind: "widget", path: "lib/features/home/home_screen.dart", line: 4 }], count: 1 },
    "search.find_file": { matches: ["lib/main.dart", "lib/features/home/home_screen.dart"], count: 2 },
    "fs.read_file": { path: "lib/main.dart", content: "// File content loaded", lines: 25 },
    "fs.write_file": { path: "lib/main.dart", patchId: "patch_001", lines: 25, message: "File updated successfully" },
    "fs.create_file": { path: "lib/features/home/home_screen.dart", created: true, message: "File created" },
    "fs.list_directory": { path: ".", entries: [{ name: "lib", type: "folder" }, { name: "test", type: "folder" }, { name: "pubspec.yaml", type: "file" }], count: 3 },
    "flutter.analyze": { diagnostics: [], errorCount: 0, warningCount: 0, success: true, message: "No issues found!" },
    "flutter.test": { passed: 5, failed: 0, skipped: 0, coverage: 75, success: true, message: "All tests passed!" },
    "flutter.build_apk": { artifactPath: "/build/app/outputs/apk/release/app-release.apk", size: "28MB", success: true },
  };

  // Find the first matching tool output
  for (const toolId of task.requiredTools) {
    if (toolOutputs[toolId]) {
      return { task: task.title, agent: task.assignedAgentId, tool: toolId, result: toolOutputs[toolId] };
    }
  }

  // Default output for tasks without specific tools
  return { task: task.title, agent: task.assignedAgentId, message: "Task completed successfully", simulated: true };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

void evaluatePlan;
