/**
 * @module features/execution/approval
 *
 * Approval Manager — for Moderate/High/Critical tools, an ApprovalRequest
 * is created and must be explicitly approved or rejected by the user
 * before execution proceeds.
 */

import type { ApprovalRequest, ApprovalStatus, Patch, RiskLevel } from "../types";
import { eventBus } from "../events";
import { uid } from "@/lib/utils";

const requests = new Map<string, ApprovalRequest>();

/** Create an approval request for a pending execution. */
export function requestApproval(params: {
  requestId: string;
  toolId: string;
  toolName: string;
  riskLevel: RiskLevel;
  parameters: Record<string, unknown>;
  patch?: Patch;
  reason: string;
}): ApprovalRequest {
  const approval: ApprovalRequest = {
    id: uid("appr"),
    requestId: params.requestId,
    toolId: params.toolId,
    toolName: params.toolName,
    riskLevel: params.riskLevel,
    parameters: params.parameters,
    patch: params.patch,
    reason: params.reason,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  requests.set(approval.id, approval);
  eventBus.emit("approval:requested", {
    requestId: params.requestId,
    toolId: params.toolId,
    message: `Approval requested for ${params.toolName} (${params.riskLevel})`,
    details: approval,
  });
  return approval;
}

/** Get an approval request by id. */
export function getApproval(id: string): ApprovalRequest | undefined {
  return requests.get(id);
}

/** Get the approval for a given execution request. */
export function getByRequestId(requestId: string): ApprovalRequest | undefined {
  for (const a of requests.values()) {
    if (a.requestId === requestId) return a;
  }
  return undefined;
}

/** Approve a pending request. Returns the updated approval. */
export function approve(id: string, decidedBy = "user"): ApprovalRequest | undefined {
  const approval = requests.get(id);
  if (!approval || approval.status !== "pending") return undefined;
  approval.status = "approved";
  approval.decidedAt = new Date().toISOString();
  approval.decidedBy = decidedBy;
  requests.set(id, approval);
  eventBus.emit("approval:granted", {
    requestId: approval.requestId,
    toolId: approval.toolId,
    message: `Approved ${approval.toolName}`,
    details: approval,
  });
  return approval;
}

/** Reject a pending request. */
export function reject(id: string, decidedBy = "user"): ApprovalRequest | undefined {
  const approval = requests.get(id);
  if (!approval || approval.status !== "pending") return undefined;
  approval.status = "rejected";
  approval.decidedAt = new Date().toISOString();
  approval.decidedBy = decidedBy;
  requests.set(id, approval);
  eventBus.emit("approval:rejected", {
    requestId: approval.requestId,
    toolId: approval.toolId,
    message: `Rejected ${approval.toolName}`,
    details: approval,
  });
  return approval;
}

/** List all approval requests, optionally filtered by status. */
export function listApprovals(status?: ApprovalStatus): ApprovalRequest[] {
  const all = Array.from(requests.values()).reverse();
  return status ? all.filter((a) => a.status === status) : all;
}

/** Count pending approvals. */
export function pendingCount(): number {
  let count = 0;
  for (const a of requests.values()) {
    if (a.status === "pending") count++;
  }
  return count;
}
