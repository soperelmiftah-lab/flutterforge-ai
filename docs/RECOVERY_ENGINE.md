# Recovery Engine

The Recovery Engine handles tool failures automatically. When a tool fails, it chooses the best recovery strategy: retry, alternative tool, rollback, resume, skip, or escalate.

## Recovery actions

| Action | When | Description |
|--------|------|-------------|
| `retry` | Transient failure (timeout, network) | Try the same tool again (up to max retries) |
| `alternative` | Fallback available | Switch to a fallback or equivalent tool |
| `rollback` | Side effects present | Undo mutations via snapshot restore |
| `resume` | Checkpoint available | Continue from last successful step |
| `skip` | Non-critical step | Skip the failed step and continue |
| `escalate` | Critical failure | Hand off to the Planner for re-planning |

## Decision flow

```
Tool fails
    │
    ├─ Is it transient (timeout/network) AND retries < max?
    │   └─ YES → retry
    │
    ├─ Does the step have fallbacks?
    │   └─ YES → alternative (use first fallback)
    │
    ├─ Does the step have filesystem side effects?
    │   └─ YES → rollback (restore snapshot)
    │
    ├─ Is the step non-critical (no approval needed)?
    │   └─ YES → skip
    │
    └─ Otherwise → escalate to Planner
```

## Recovery plan

```typescript
interface RecoveryPlan {
  failedStepId: string;
  failedToolId: string;
  action: RecoveryAction;
  alternativeToolId?: string;
  rollbackSteps: string[];
  maxRetries: number;
  retryCount: number;
  escalateTo: string;
  reason: string;
}
```

## Creating a recovery plan

```typescript
import { createRecoveryPlan, executeRecovery } from "@/features/tool-intelligence/recovery";

const plan = createRecoveryPlan(failedStep, "timeout after 30000ms", 1);
// plan.action = "retry"

const result = executeRecovery(plan);
// { action: "retry", message: "Retrying fs.write_file (attempt 2/3)" }
```

## Finding alternative tools

The Recovery Engine finds alternatives by:
1. Checking the step's declared `fallbacks`
2. Searching for tools in the same category with `safe` risk level

## API

```bash
POST /api/v1/tools/recover
{ "action": "create", "failedStep": {...}, "failureReason": "timeout" }

POST /api/v1/tools/recover
{ "action": "execute", "plan": {...} }
```

## UI

The **Recovery Center** tab shows all 6 recovery strategies with descriptions and the decision flow.
