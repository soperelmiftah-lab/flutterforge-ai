# Approval System

Every Moderate, High, and Critical tool execution requires explicit user approval before proceeding. This ensures agents can never perform dangerous operations without human consent.

## How it works

```
Agent calls execute() with a moderate/high/critical tool
        │
        ▼
Execution Engine checks riskLevel
        │
        ├─ safe → proceed immediately
        └─ moderate/high/critical
              │
              ├─ Create ApprovalRequest
              ├─ Return status: "pending-approval"
              ├─ Emit "approval:requested" event
              └─ Wait for user decision
                    │
                    ├─ User approves → status: "approved" → proceed
                    └─ User rejects  → status: "rejected" → fail
```

## Risk levels requiring approval

| Level | Approval | Examples |
|-------|----------|----------|
| `safe` | No | Read, list, search, copy |
| `moderate` | **Yes** | Write, create, rename, commit, branch |
| `high` | **Yes** | Delete, build APK, checkout, execute command |
| `critical` | **Yes** | Delete directory, git reset |

## Approval request

```typescript
interface ApprovalRequest {
  id: string;
  requestId: string;      // The execution request awaiting approval
  toolId: string;
  toolName: string;
  riskLevel: RiskLevel;
  parameters: Record<string, unknown>;
  patch?: Patch;          // Generated patch (for write operations)
  reason: string;         // Why approval is needed
  status: "pending" | "approved" | "rejected" | "expired";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
```

## UI — Approval Queue

The **Execution → Approval Queue** tab shows all pending approvals:

- Tool name + risk level badge
- Reason for approval
- Parameters (JSON)
- Patch preview (diff viewer) — for write operations
- **Approve** / **Reject** buttons

## API

```bash
# Approve
POST /api/v1/execution/approve
{ "requestId": "exec_abc" }

# Reject
POST /api/v1/execution/reject
{ "requestId": "exec_abc" }
```

## Skipping approval

Only `safe` tools can skip approval (`skipApproval: true` in the request). This is used internally for preview operations. Moderate/high/critical tools ALWAYS require approval regardless of the `skipApproval` flag.

## Events

| Event | When |
|-------|------|
| `approval:requested` | An approval request is created |
| `approval:granted` | The user approves |
| `approval:rejected` | The user rejects |

## Safety guarantees

- Agents CANNOT bypass approval for non-safe tools
- The `skipApproval` flag is ignored for moderate/high/critical
- Every approval decision is recorded (who, when, decision)
- Pending approvals persist until decided (no timeout in Phase 4)
