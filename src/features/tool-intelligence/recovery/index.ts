/**
 * @module features/tool-intelligence/recovery
 *
 * Recovery Engine — if a tool fails, automatically chooses a recovery
 * strategy: retry, alternative tool, rollback, resume, skip, or escalate.
 */

import type { RecoveryPlan, RecoveryAction, ChainStep } from "../types";
import { getToolDescriptor, listTools } from "@/features/execution/registry";
import { uid } from "@/lib/utils";

/** Create a recovery plan for a failed step. */
export function createRecoveryPlan(
  failedStep: ChainStep,
  failureReason: string,
  retryCount: number = 0
): RecoveryPlan {
  const action = chooseRecoveryAction(failedStep, failureReason, retryCount);
  const alternativeToolId = findAlternativeTool(failedStep);

  return {
    failedStepId: failedStep.id,
    failedToolId: failedStep.toolId,
    action,
    alternativeToolId,
    rollbackSteps: findRollbackSteps(failedStep),
    maxRetries: 3,
    retryCount,
    escalateTo: "agent.planner",
    reason: failureReason,
  };
}

/** Choose the best recovery action based on the failure. */
function chooseRecoveryAction(
  step: ChainStep,
  reason: string,
  retryCount: number
): RecoveryAction {
  // If we haven't retried yet and the failure is transient, retry.
  if (retryCount < 3 && (reason.includes("timeout") || reason.includes("network") || reason.includes("temporary"))) {
    return "retry";
  }

  // If there are fallbacks, try an alternative.
  if (step.fallbacks.length > 0) {
    return "alternative";
  }

  // If the step has side effects, rollback.
  if (step.toolId.startsWith("fs.") && (step.toolId.includes("write") || step.toolId.includes("create") || step.toolId.includes("delete"))) {
    return "rollback";
  }

  // If the step is non-critical, skip it.
  if (!step.requiresApproval) {
    return "skip";
  }

  // Otherwise, escalate to the planner.
  return "escalate";
}

/** Find an alternative tool that can do the same job. */
function findAlternativeTool(step: ChainStep): string | undefined {
  // Check the step's declared fallbacks first.
  if (step.fallbacks.length > 0) return step.fallbacks[0];

  // Find tools in the same category with similar capabilities.
  const tool = getToolDescriptor(step.toolId);
  if (!tool) return undefined;

  const alternatives = listTools().filter(
    (t) =>
      t.id !== step.toolId &&
      t.category === tool.category &&
      t.implemented &&
      t.riskLevel === "safe"
  );

  return alternatives[0]?.id;
}

/** Find steps that need rollback if the failed step has side effects. */
function findRollbackSteps(failedStep: ChainStep): string[] {
  // Rollback all steps that modified the filesystem before this failure.
  const rollback: string[] = [];
  if (failedStep.toolId.startsWith("fs.") && (failedStep.toolId.includes("write") || failedStep.toolId.includes("create") || failedStep.toolId.includes("delete"))) {
    rollback.push(failedStep.id);
  }
  return rollback;
}

/** Execute a recovery plan (returns the action to take). */
export function executeRecovery(plan: RecoveryPlan): {
  action: RecoveryAction;
  message: string;
  nextToolId?: string;
} {
  switch (plan.action) {
    case "retry":
      return { action: "retry", message: `Retrying ${plan.failedToolId} (attempt ${plan.retryCount + 1}/${plan.maxRetries})` };
    case "alternative":
      return {
        action: "alternative",
        message: `Switching to alternative tool: ${plan.alternativeToolId ?? "none available"}`,
        nextToolId: plan.alternativeToolId,
      };
    case "rollback":
      return { action: "rollback", message: `Rolling back ${plan.rollbackSteps.length} step(s)` };
    case "resume":
      return { action: "resume", message: "Resuming from last checkpoint" };
    case "skip":
      return { action: "skip", message: `Skipping non-critical step ${plan.failedStepId}` };
    case "escalate":
      return { action: "escalate", message: `Escalating to ${plan.escalateTo}` };
    default:
      return { action: "skip", message: "Unknown recovery action" };
  }
}

/** Get all recovery actions (for UI). */
export function listRecoveryActions(): Array<{ action: RecoveryAction; label: string; description: string }> {
  return [
    { action: "retry", label: "Retry", description: "Try the same tool again (up to max retries)" },
    { action: "alternative", label: "Alternative", description: "Switch to a fallback or equivalent tool" },
    { action: "rollback", label: "Rollback", description: "Undo side effects via snapshot restore" },
    { action: "resume", label: "Resume", description: "Continue from the last successful checkpoint" },
    { action: "skip", label: "Skip", description: "Skip the failed step (if non-critical)" },
    { action: "escalate", label: "Escalate", description: "Hand off to the planner for re-planning" },
  ];
}

void uid;
