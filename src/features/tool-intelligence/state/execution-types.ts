/**
 * @module features/tool-intelligence/state/execution-types
 *
 * Types for real chain execution against the Execution Engine.
 */

import type { ExecutionResult } from "@/features/execution/types";
import type { RecoveryPlan } from "../types";

export type StepStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped"
  | "rolled-back";

export interface StepExecution {
  /** The chain step id. */
  stepId: string;
  /** The tool id executed. */
  toolId: string;
  /** The tool name. */
  toolName: string;
  /** Step status. */
  status: StepStatus;
  /** The execution request id (from the Execution Engine). */
  requestId?: string;
  /** The result returned by the Execution Engine. */
  result?: ExecutionResult;
  /** Recovery plan, if the step failed and was recovered. */
  recoveryPlan?: RecoveryPlan;
  /** Recovery attempt log (one entry per retry / fallback). */
  recoveryAttempts?: Array<{ action: string; message: string; at: string }>;
  /** Wall-clock duration in ms. */
  durationMs?: number;
  /** When the step started. */
  startedAt?: string;
  /** When the step finished. */
  finishedAt?: string;
  /** Error message if status === "failed". */
  error?: string;
}

export type ChainExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed"
  | "cancelled";

export interface ChainExecution {
  /** Unique execution id. */
  id: string;
  /** The chain id. */
  chainId: string;
  /** The objective the chain was built for. */
  objective: string;
  /** Per-step execution state. */
  steps: StepExecution[];
  /** Overall status. */
  status: ChainExecutionStatus;
  /** Number of successful steps. */
  successCount: number;
  /** Number of failed steps. */
  failureCount: number;
  /** Number of skipped steps. */
  skippedCount: number;
  /** Total wall-clock duration in ms. */
  durationMs: number;
  /** Total tokens used (estimated). */
  tokensUsed: number;
  /** When the execution started. */
  startedAt: string;
  /** When the execution finished. */
  finishedAt?: string;
  /** Error message (only set on overall failure). */
  error?: string;
}

/** Compute the progress percentage (0–100) for an execution. */
export function executionProgress(exec: ChainExecution): number {
  if (exec.steps.length === 0) return 0;
  const completed = exec.steps.filter(
    (s) =>
      s.status === "success" ||
      s.status === "failed" ||
      s.status === "skipped" ||
      s.status === "rolled-back"
  ).length;
  return Math.round((completed / exec.steps.length) * 100);
}
