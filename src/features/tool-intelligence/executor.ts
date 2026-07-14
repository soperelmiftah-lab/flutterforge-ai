/**
 * @module features/tool-intelligence/executor
 *
 * Real Tool Chain Executor. Runs each ChainStep through the Execution Engine's
 * execute() API, captures per-step results, applies recovery on failure, and
 * records learning data for future tool selection.
 *
 * Pipeline:
 *   For each step (respecting dependencies):
 *     1. Create an ExecutionRequest
 *     2. Call execute() — routes through validation, permissions, approval,
 *        queue, tool executor, patches, history, telemetry, events.
 *     3. On failure: create a recovery plan, execute it (retry / alternative /
 *        rollback / skip / escalate), record the attempt.
 *     4. Record a learning entry (success/failure + duration).
 *     5. Update the ChainExecution state.
 *
 * Approval policy: by default, skipApproval=true so the chain runs end-to-end
 * without user prompts (the chain itself was already validated + simulated).
 * Callers can override with { requireApproval: true } for high-risk chains.
 */

import type { ToolChain, ChainStep } from "./types";
import type { ExecutionResult } from "@/features/execution/types";
import { createRequest, execute } from "@/features/execution/core";
import { recordExecution } from "./learning";
import { createRecoveryPlan, executeRecovery } from "./recovery";
import { eventBus } from "@/features/execution/events";
import { uid } from "@/lib/utils";
import type {
  ChainExecution,
  StepExecution,
  StepStatus,
} from "./state/execution-types";

export interface ExecuteChainOptions {
  /** Skip per-tool approval prompts (default: true). */
  skipApproval?: boolean;
  /** Maximum recovery retries per failed step (default: 2). */
  maxRetries?: number;
  /** Progress callback, fired after each step. */
  onProgress?: (exec: ChainExecution) => void;
}

/** Execute a tool chain. Returns the final execution state. */
export async function executeChain(
  chain: ToolChain,
  options: ExecuteChainOptions = {}
): Promise<ChainExecution> {
  const skipApproval = options.skipApproval ?? true;
  const maxRetries = options.maxRetries ?? 2;

  const exec: ChainExecution = {
    id: uid("exec"),
    chainId: chain.id,
    objective: chain.objective,
    steps: chain.steps.map((s) => ({
      stepId: s.id,
      toolId: s.toolId,
      toolName: s.toolName,
      status: "pending" as StepStatus,
    })),
    status: "running",
    successCount: 0,
    failureCount: 0,
    skippedCount: 0,
    durationMs: 0,
    tokensUsed: 0,
    startedAt: new Date().toISOString(),
  };

  const start = Date.now();

  for (let i = 0; i < chain.steps.length; i++) {
    const step = chain.steps[i];
    const stepExec = exec.steps[i];

    // Check dependencies — if any failed, skip this step.
    if (!dependenciesMet(step, exec)) {
      stepExec.status = "skipped";
      stepExec.finishedAt = new Date().toISOString();
      exec.skippedCount++;
      options.onProgress?.(exec);
      continue;
    }

    stepExec.status = "running";
    stepExec.startedAt = new Date().toISOString();
    options.onProgress?.(exec);

    // Run the step (with recovery retries).
    const result = await runStepWithRecovery(step, stepExec, {
      skipApproval,
      maxRetries,
      chainId: chain.id,
    });

    stepExec.finishedAt = new Date().toISOString();
    stepExec.durationMs = result.durationMs;
    stepExec.result = result.result;
    stepExec.status = result.status;
    if (result.error) stepExec.error = result.error;

    // Record learning data.
    recordExecution({
      toolId: step.toolId,
      chainId: chain.id,
      success: result.status === "success",
      durationMs: result.durationMs,
      tokensUsed: step.estimatedTokens,
    });

    if (result.status === "success") {
      exec.successCount++;
      exec.tokensUsed += step.estimatedTokens;
    } else if (result.status === "skipped" || result.status === "rolled-back") {
      exec.skippedCount++;
    } else {
      exec.failureCount++;
    }

    options.onProgress?.(exec);
  }

  // Determine final status.
  exec.durationMs = Date.now() - start;
  exec.finishedAt = new Date().toISOString();

  if (exec.failureCount === 0) {
    exec.status = "completed";
  } else if (exec.successCount > 0) {
    exec.status = "partial";
  } else {
    exec.status = "failed";
  }

  return exec;
}

/** Run a single step, retrying via the recovery engine on failure. */
async function runStepWithRecovery(
  step: ChainStep,
  stepExec: StepExecution,
  ctx: { skipApproval: boolean; maxRetries: number; chainId: string }
): Promise<{ status: StepStatus; result?: ExecutionResult; durationMs: number; error?: string }> {
  const start = Date.now();
  let attempt = 0;
  stepExec.recoveryAttempts = [];

  while (attempt <= ctx.maxRetries) {
    const request = createRequest({
      toolId: step.toolId,
      parameters: step.parameters,
      initiatedBy: "agent",
      agentId: "tool-intelligence",
      skipApproval: ctx.skipApproval,
      priority: 1,
    });

    stepExec.requestId = request.id;
    const result = await execute(request);

    if (result.status === "success") {
      return {
        status: "success",
        result,
        durationMs: Date.now() - start,
      };
    }

    // Failure — build a recovery plan.
    const failureReason = result.error ?? "unknown error";
    const plan = createRecoveryPlan(step, failureReason, attempt);
    stepExec.recoveryPlan = plan;
    const action = executeRecovery(plan);

    stepExec.recoveryAttempts.push({
      action: action.action,
      message: action.message,
      at: new Date().toISOString(),
    });

    eventBus.emit("tool:failed", {
      requestId: request.id,
      toolId: step.toolId,
      message: `Step ${step.id} failed (attempt ${attempt + 1}/${ctx.maxRetries + 1}): ${failureReason}. Recovery: ${action.action}`,
      details: { attempt, action: action.action, failureReason },
    });

    // Try the alternative tool if available.
    if (action.action === "alternative" && action.nextToolId) {
      attempt++;
      // Swap to the fallback tool for the next iteration.
      step = { ...step, toolId: action.nextToolId, fallbacks: [] };
      continue;
    }

    if (action.action === "retry" && attempt < ctx.maxRetries) {
      attempt++;
      continue;
    }

    if (action.action === "skip") {
      return {
        status: "skipped",
        result,
        durationMs: Date.now() - start,
        error: failureReason,
      };
    }

    if (action.action === "rollback") {
      return {
        status: "rolled-back",
        result,
        durationMs: Date.now() - start,
        error: failureReason,
      };
    }

    // escalate or unknown → mark as failed.
    return {
      status: "failed",
      result,
      durationMs: Date.now() - start,
      error: failureReason,
    };
  }

  // Exhausted retries.
  return {
    status: "failed",
    durationMs: Date.now() - start,
    error: `Exhausted ${ctx.maxRetries + 1} attempts`,
  };
}

/** Check whether all dependencies of a step completed successfully. */
function dependenciesMet(step: ChainStep, exec: ChainExecution): boolean {
  if (step.dependsOn.length === 0) return true;
  for (const depId of step.dependsOn) {
    const dep = exec.steps.find((s) => s.stepId === depId);
    if (!dep) continue;
    if (dep.status !== "success") return false;
  }
  return true;
}
