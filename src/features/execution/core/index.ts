/**
 * @module features/execution/core
 *
 * The Execution Engine — the central execute() API. EVERY agent operation
 * passes through here. The pipeline:
 *
 *   1. Validate the request (tool exists, parameters valid)
 *   2. Check permissions (permission manager)
 *   3. If risk > safe → create an approval request and pause
 *   4. Enqueue the request (priority queue)
 *   5. Execute the tool (tool executor)
 *   6. Generate a patch (if the tool produces one)
 *   7. Record history + telemetry + logs
 *   8. Emit events
 *
 * Supports rollback: every tool that supportsRollback creates a snapshot
 * before execution, restorable via the rollback manager.
 */

import type {
  ExecutionRequest,
  ExecutionResult,
  ToolDescriptor,
} from "../types";
import { getToolDescriptor, executeTool } from "../registry";
import { hasAllPermissions, requiresApproval, getActivePermissions } from "../permissions";
import { requestApproval, approve as approveRequest, reject as rejectRequest, getByRequestId as getApprovalByRequestId } from "../approval";
import { executionQueue } from "../queue";
import { recordHistory } from "../history";
import { eventBus } from "../events";
import { logger } from "../logger";
import { telemetry } from "../telemetry";
import { uid } from "@/lib/utils";

// Ensure logger + telemetry are listening.
logger.init();
telemetry.init();

/** Create a new execution request. */
export function createRequest(params: {
  toolId: string;
  parameters: Record<string, unknown>;
  initiatedBy?: "user" | "agent";
  agentId?: string;
  priority?: number;
  skipApproval?: boolean;
}): ExecutionRequest {
  return {
    id: uid("exec"),
    toolId: params.toolId,
    parameters: params.parameters,
    initiatedBy: params.initiatedBy ?? "user",
    agentId: params.agentId,
    priority: params.priority ?? 0,
    skipApproval: params.skipApproval,
    createdAt: new Date().toISOString(),
  };
}

/** The central execute() API. Every agent operation goes through here. */
export async function execute(request: ExecutionRequest): Promise<ExecutionResult> {
  const start = Date.now();

  // 1. Validate — tool exists + is implemented.
  const descriptor = getToolDescriptor(request.toolId);
  if (!descriptor) {
    const result: ExecutionResult = {
      requestId: request.id,
      status: "failed",
      error: `Unknown tool: ${request.toolId}`,
      durationMs: 0,
      finishedAt: new Date().toISOString(),
    };
    recordFailure(request, descriptor, result, 0);
    return result;
  }

  // 2. Check permissions.
  const permCheck = hasAllPermissions(getActivePermissions(), descriptor.permissions);
  if (!permCheck.allowed) {
    const result: ExecutionResult = {
      requestId: request.id,
      status: "failed",
      error: `Missing permissions: ${permCheck.missing.join(", ")}`,
      durationMs: 0,
      finishedAt: new Date().toISOString(),
    };
    recordFailure(request, descriptor, result, 0);
    return result;
  }

  // 3. Approval gate — moderate/high/critical tools need explicit approval.
  if (requiresApproval(descriptor.riskLevel) && !request.skipApproval) {
    const existing = getApprovalByRequestId(request.id);
    if (!existing) {
      // Create the approval request and return a pending-approval result.
      requestApproval({
        requestId: request.id,
        toolId: descriptor.id,
        toolName: descriptor.name,
        riskLevel: descriptor.riskLevel,
        parameters: request.parameters,
        reason: `${descriptor.name} is a ${descriptor.riskLevel}-risk operation and requires approval.`,
      });
      const result: ExecutionResult = {
        requestId: request.id,
        status: "pending-approval",
        durationMs: Date.now() - start,
        finishedAt: new Date().toISOString(),
      };
      return result;
    }
    if (existing.status === "pending") {
      // Still waiting for approval.
      return {
        requestId: request.id,
        status: "pending-approval",
        durationMs: Date.now() - start,
        finishedAt: new Date().toISOString(),
      };
    }
    if (existing.status === "rejected") {
      const result: ExecutionResult = {
        requestId: request.id,
        status: "failed",
        error: "Execution rejected by user",
        durationMs: Date.now() - start,
        finishedAt: new Date().toISOString(),
      };
      recordFailure(request, descriptor, result, Date.now() - start);
      return result;
    }
    // approved — proceed.
  }

  // 4. Enqueue.
  executionQueue.enqueue(request.id, request.toolId, request.priority ?? 0);

  // 5. Execute.
  eventBus.emit("tool:started", {
    requestId: request.id,
    toolId: request.toolId,
    message: `Started ${descriptor.name}`,
  });

  const result = await executeTool(request);

  // 6. Record history + telemetry + events.
  executionQueue.complete(request.id, result.status);
  recordHistory({
    requestId: request.id,
    toolId: descriptor.id,
    toolName: descriptor.name,
    category: descriptor.category,
    parameters: request.parameters,
    status: result.status,
    riskLevel: descriptor.riskLevel,
    initiatedBy: request.initiatedBy,
    agentId: request.agentId,
    output: result.output,
    error: result.error,
    patchId: result.patch?.id,
    snapshotId: result.snapshotId,
    durationMs: result.durationMs,
  });
  telemetry.record(descriptor.id, result.status, result.durationMs);

  if (result.status === "success") {
    eventBus.emit("tool:finished", {
      requestId: request.id,
      toolId: request.toolId,
      message: `${descriptor.name} completed in ${result.durationMs}ms`,
      details: { status: result.status, durationMs: result.durationMs },
    });
    if (result.patch) {
      eventBus.emit("patch:generated", {
        requestId: request.id,
        toolId: request.toolId,
        message: `Patch generated for ${result.patch.path}`,
        details: result.patch,
      });
    }
  } else {
    eventBus.emit("tool:failed", {
      requestId: request.id,
      toolId: request.toolId,
      message: `${descriptor.name} failed: ${result.error}`,
      details: { status: result.status, durationMs: result.durationMs },
    });
  }

  return result;
}

/** Approve a pending execution. Returns the updated approval, or undefined. */
export function approve(requestId: string): boolean {
  const approval = getApprovalByRequestId(requestId);
  if (!approval) return false;
  return !!approveRequest(approval.id);
}

/** Reject a pending execution. */
export function reject(requestId: string): boolean {
  const approval = getApprovalByRequestId(requestId);
  if (!approval) return false;
  return !!rejectRequest(approval.id);
}

function recordFailure(
  request: ExecutionRequest,
  descriptor: ToolDescriptor | undefined,
  result: ExecutionResult,
  durationMs: number
) {
  if (!descriptor) return;
  recordHistory({
    requestId: request.id,
    toolId: descriptor.id,
    toolName: descriptor.name,
    category: descriptor.category,
    parameters: request.parameters,
    status: "failed",
    riskLevel: descriptor.riskLevel,
    initiatedBy: request.initiatedBy,
    agentId: request.agentId,
    error: result.error,
    durationMs,
  });
  telemetry.record(descriptor.id, "failed", durationMs);
  eventBus.emit("tool:failed", {
    requestId: request.id,
    toolId: descriptor.id,
    message: `${descriptor.name} failed: ${result.error}`,
    details: { durationMs },
  });
}
