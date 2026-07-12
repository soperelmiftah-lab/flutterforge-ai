# Execution Engine

The Execution Engine is the operating system for every AI Agent in FlutterForge AI. Future agents NEVER manipulate the filesystem directly — every operation flows through the central `execute()` API.

## Architecture

```
User / Agent
     │
     ▼
execute()  ←── the single entry point
     │
     ├─ 1. Validate (tool exists, parameters valid)
     ├─ 2. Permissions (scope check)
     ├─ 3. Approval gate (moderate/high/critical → pause)
     ├─ 4. Queue (priority, sequential/parallel)
     ├─ 5. Tool Executor (runs the tool)
     ├─ 6. Patch Engine (generates diff, never overwrites)
     ├─ 7. History (record everything)
     ├─ 8. Events (emit to bus)
     └─ 9. Telemetry (metrics)
           │
           ▼
    Filesystem / Git / Flutter / Terminal
```

## The `execute()` API

```typescript
import { createRequest, execute } from "@/features/execution/core";

const request = createRequest({
  toolId: "fs.write_file",
  parameters: { path: "lib/main.dart", content: "..." },
  initiatedBy: "agent",
  agentId: "agent_001",
});

const result = await execute(request);
// result.status: "success" | "pending-approval" | "failed" | ...
```

### Result statuses

| Status | Meaning |
|--------|---------|
| `queued` | Waiting in the queue |
| `pending-approval` | Needs user approval (moderate/high/critical) |
| `approved` | Approval granted, proceeding |
| `running` | Tool is executing |
| `success` | Completed successfully |
| `failed` | Execution failed (see `error`) |
| `cancelled` | Cancelled by user/agent |
| `rolled-back` | A snapshot was restored |

## Pipeline stages

### 1. Validation
- Tool must exist in the registry
- Tool must be `implemented: true`
- Parameters are passed through (future: JSON Schema validation)

### 2. Permissions
Every tool declares required `permissions` (scopes). The Permission Manager checks:
- Is the scope in the **granted** list?
- Is it in the **denied** list (overrides granted)?

If any required scope is missing, execution fails immediately.

### 3. Approval gate
Risk levels `moderate`, `high`, and `critical` require explicit user approval:
- An `ApprovalRequest` is created
- The execution returns `pending-approval`
- The user approves/rejects via the Approval Queue UI
- On approval, execution proceeds; on rejection, it fails

### 4. Queue
- **Sequential** (default): one tool at a time
- **Parallel**: up to N concurrent (configurable)
- Priority ordering (higher priority dequeues first)
- Cancel, pause, resume, retry supported

### 5. Tool Executor
Dispatches to the tool's executor function. Each category has its own implementation:
- `filesystem` → Virtual Filesystem (in-memory)
- `editor` → Patch Engine + VFS
- `search` → VFS + Symbol Engine
- `flutter` → stub (Phase 5+)
- `git` → stub (Phase 5+)
- `terminal` → stub (Phase 5+)

### 6. Patch Engine
Write operations NEVER overwrite files directly. Instead:
1. Read the current content (`before`)
2. Compute the new content (`after`)
3. Generate a `Patch` (unified diff + hunks)
4. Apply the patch (or preview it first)

### 7. History
Every execution is recorded:
- Tool, parameters, status, duration
- Who initiated (user/agent)
- Output, error, patch id, snapshot id

### 8. Events
The Event Bus emits:
- `tool:started`, `tool:finished`, `tool:failed`
- `approval:requested`, `approval:granted`, `approval:rejected`
- `patch:generated`, `patch:applied`, `patch:rejected`
- `rollback:completed`
- `queue:enqueued`, `queue:cancelled`

### 9. Telemetry
Per-tool metrics:
- Execution count, success count, failure count
- Average duration, success rate
- Last executed timestamp

## Rollback

Tools with `supportsRollback: true` create a `Snapshot` before execution:
- `Snapshot` = file path + content at execution time
- `restoreSnapshot(id)` → restores the file to its pre-execution state
- `undo()` / `redo()` → stack-based undo/redo

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/execution/execute` | Execute a tool |
| GET | `/api/v1/execution/history` | Execution history + pending approvals |
| POST | `/api/v1/execution/rollback` | Restore/undo/redo/list snapshots |
| GET | `/api/v1/execution/tools` | List all registered tools + telemetry |
| GET | `/api/v1/execution/queue` | Queue state + stats |
| POST | `/api/v1/execution/approve` | Approve a pending execution |
| POST | `/api/v1/execution/reject` | Reject a pending execution |

## State management

| Store | Purpose |
|-------|---------|
| `useExecutionStore` | Active + recent executions |
| `useToolStore` | Tool registry with search/filter |
| `useApprovalStore` | Pending approvals |
| `useHistoryStore` | Execution history with filters |
| `useQueueStore` | Queue state + stats |
| `useTelemetryStore` | Per-tool telemetry |

## Safety guarantees

1. **Never direct filesystem access** — all mutations go through tools
2. **Never overwrite** — patches are generated and applied explicitly
3. **Approval required** for moderate/high/critical operations
4. **Rollback available** for tools that support it
5. **Everything recorded** — history, logs, telemetry
6. **Events emitted** — every stage is observable

See also: [TOOLS.md](./TOOLS.md), [PATCH_ENGINE.md](./PATCH_ENGINE.md), [DIFF_VIEWER.md](./DIFF_VIEWER.md), [APPROVAL_SYSTEM.md](./APPROVAL_SYSTEM.md), [EVENT_BUS.md](./EVENT_BUS.md).
