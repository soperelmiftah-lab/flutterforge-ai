/**
 * @module features/execution/types
 *
 * Core domain types for the Execution Engine. Every agent operation flows
 * through these types. They are the contract between the Planner (future),
 * the Execution Engine, the Tool Registry, and the filesystem/Git/Flutter.
 */

import type { WorkspacePath } from "@/features/workspace-intelligence/types";

// ─── Risk levels ────────────────────────────────────────────────────────

/** How dangerous a tool is. Drives the approval flow. */
export type RiskLevel = "safe" | "moderate" | "high" | "critical";

export const RISK_LEVEL_META: Record<
  RiskLevel,
  { label: string; color: string; requiresApproval: boolean }
> = {
  safe: { label: "Safe", color: "text-emerald-600 dark:text-emerald-400", requiresApproval: false },
  moderate: { label: "Moderate", color: "text-amber-600 dark:text-amber-400", requiresApproval: true },
  high: { label: "High", color: "text-orange-600 dark:text-orange-400", requiresApproval: true },
  critical: { label: "Critical", color: "text-rose-600 dark:text-rose-400", requiresApproval: true },
};

// ─── Permissions ────────────────────────────────────────────────────────

/** Permission scopes. A tool declares which scopes it needs. */
export type PermissionScope =
  | "filesystem:read"
  | "filesystem:write"
  | "filesystem:delete"
  | "terminal:execute"
  | "flutter:run"
  | "flutter:build"
  | "git:read"
  | "git:write"
  | "ai:chat"
  | "network:fetch";

export interface PermissionSet {
  /** Granted scopes (allow-list). */
  granted: PermissionScope[];
  /** Explicitly denied scopes (deny-list, overrides granted). */
  denied: PermissionScope[];
}

// ─── Tool definitions ───────────────────────────────────────────────────

export type ToolCategory =
  | "filesystem"
  | "editor"
  | "search"
  | "flutter"
  | "git"
  | "terminal";

/** A tool parameter (JSON-Schema-shaped). */
export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
}

/** Static tool descriptor — registered in the Tool Registry. */
export interface ToolDescriptor {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  riskLevel: RiskLevel;
  permissions: PermissionScope[];
  parameters: ToolParameter[];
  /** Default timeout in ms. */
  timeoutMs: number;
  /** Whether the tool can be rolled back. */
  supportsRollback: boolean;
  /** Whether the tool produces a previewable patch. */
  supportsPreview: boolean;
  /** Whether the tool is implemented (true) or a stub (false). */
  implemented: boolean;
}

// ─── Execution requests & results ───────────────────────────────────────

export type ExecutionStatus =
  | "queued"
  | "pending-approval"
  | "approved"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "rolled-back";

export interface ExecutionRequest {
  /** Unique id for tracing. */
  id: string;
  /** Tool id to execute. */
  toolId: string;
  /** Tool parameters (validated against the descriptor). */
  parameters: Record<string, unknown>;
  /** Who initiated the execution. */
  initiatedBy: "user" | "agent";
  /** Agent id, if initiatedBy === "agent". */
  agentId?: string;
  /** Requested priority (higher = sooner). */
  priority?: number;
  /** Whether to skip the approval prompt (only allowed for safe tools). */
  skipApproval?: boolean;
  /** Timestamp the request was created. */
  createdAt: string;
}

export interface ExecutionResult {
  requestId: string;
  status: ExecutionStatus;
  /** Tool-specific output. */
  output?: unknown;
  /** Generated patch, if any. */
  patch?: Patch;
  /** Snapshot id for rollback, if created. */
  snapshotId?: string;
  /** Error message if status === "failed". */
  error?: string;
  /** Wall-clock duration in ms. */
  durationMs: number;
  /** When the execution finished. */
  finishedAt: string;
}

// ─── Patches & diffs ────────────────────────────────────────────────────

export interface Patch {
  id: string;
  /** Target file path. */
  path: WorkspacePath;
  /** Original content (before the patch). */
  before: string;
  /** New content (after the patch). */
  after: string;
  /** Unified diff text. */
  diff: string;
  /** Hunk-level changes. */
  hunks: DiffHunk[];
  /** Whether the patch was applied. */
  applied: boolean;
  /** Whether the patch can be partially applied. */
  partial: boolean;
  /** Conflict markers, if any. */
  conflicts?: PatchConflict[];
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: DiffLine[];
}

export interface DiffLine {
  type: "context" | "add" | "delete";
  oldNumber?: number;
  newNumber?: number;
  content: string;
}

export interface PatchConflict {
  line: number;
  message: string;
}

// ─── Snapshots & rollback ───────────────────────────────────────────────

export interface Snapshot {
  id: string;
  requestId: string;
  /** File path the snapshot captures. */
  path: WorkspacePath;
  /** Content at snapshot time. */
  content: string;
  /** When the snapshot was taken. */
  createdAt: string;
  /** Whether the snapshot has been restored. */
  restored?: boolean;
}

// ─── History ────────────────────────────────────────────────────────────

export interface HistoryEntry {
  id: string;
  requestId: string;
  toolId: string;
  toolName: string;
  category: ToolCategory;
  parameters: Record<string, unknown>;
  status: ExecutionStatus;
  riskLevel: RiskLevel;
  initiatedBy: "user" | "agent";
  agentId?: string;
  output?: unknown;
  error?: string;
  patchId?: string;
  snapshotId?: string;
  durationMs: number;
  createdAt: string;
  finishedAt: string;
}

// ─── Queue ──────────────────────────────────────────────────────────────

export type QueueMode = "sequential" | "parallel";

export interface QueueItem {
  requestId: string;
  toolId: string;
  priority: number;
  status: ExecutionStatus;
  enqueuedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

// ─── Events ─────────────────────────────────────────────────────────────

export type ExecutionEventType =
  | "tool:started"
  | "tool:finished"
  | "tool:failed"
  | "approval:requested"
  | "approval:granted"
  | "approval:rejected"
  | "patch:generated"
  | "patch:applied"
  | "patch:rejected"
  | "rollback:completed"
  | "queue:enqueued"
  | "queue:cancelled";

export interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  requestId?: string;
  toolId?: string;
  message: string;
  timestamp: string;
  details?: unknown;
}

// ─── Telemetry ──────────────────────────────────────────────────────────

export interface ToolTelemetry {
  toolId: string;
  executionCount: number;
  successCount: number;
  failureCount: number;
  totalDurationMs: number;
  averageDurationMs: number;
  successRate: number;
  lastExecutedAt?: string;
}

// ─── Approvals ──────────────────────────────────────────────────────────

export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired";

export interface ApprovalRequest {
  id: string;
  requestId: string;
  toolId: string;
  toolName: string;
  riskLevel: RiskLevel;
  parameters: Record<string, unknown>;
  patch?: Patch;
  reason: string;
  status: ApprovalStatus;
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
