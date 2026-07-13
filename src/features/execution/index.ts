/**
 * @module features/execution
 *
 * Execution Engine — the operating system for every AI Agent. Future agents
 * NEVER manipulate the filesystem directly; every operation goes through
 * execute().
 *
 * Pipeline:
 *   User/Agent → execute() → Validate → Permissions → Approval → Queue
 *     → Tool Executor → Patch Engine → History → Events → Filesystem/Git/Flutter
 *
 * Sub-modules:
 *   core/         The central execute() API
 *   types/        Tool, ExecutionRequest/Result, RiskLevel, Permissions
 *   registry/     Tool descriptors + executors (50+ tools)
 *   permissions/  Permission manager (scopes + grant/deny)
 *   approval/     Approval manager (moderate/high/critical require approval)
 *   queue/        Task queue (sequential/parallel/priority/cancel/retry)
 *   patch/        Patch engine (never overwrite — generate + apply patches)
 *   diff/         Diff engine (LCS-based line diff + unified diff format)
 *   history/      History manager (every execution recorded)
 *   events/       Event bus (tool started/finished/failed, approval, patch)
 *   logger/       Structured logger (searchable, filterable, exportable)
 *   telemetry/    Telemetry (count, success rate, avg duration per tool)
 *   filesystem/   Virtual filesystem (in-memory, snapshot/restore)
 *   rollback.ts   Rollback manager (snapshots, undo/redo/restore)
 */

export * from "./types";
export * from "./core";
export * from "./registry";
export * from "./permissions";
export * from "./approval";
export * from "./queue";
export * from "./patch";
export * from "./diff";
export * from "./history";
export * from "./events";
export * from "./logger";
export * from "./telemetry";
export * from "./filesystem";
export * from "./rollback";
