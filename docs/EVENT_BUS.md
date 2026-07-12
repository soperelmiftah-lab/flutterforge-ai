# Event Bus

The Event Bus is the central pub/sub for execution events. Every stage of the execution pipeline emits events that the UI, Logger, and Telemetry subscribe to.

## Architecture

```
Execution Engine ──emit──→ Event Bus ──notify──→ Subscribers
                                    ├─ UI (Execution Center, Approval Queue)
                                    ├─ Logger (structured logs)
                                    └─ Telemetry (metrics)
```

## Event types

| Type | When emitted |
|------|-------------|
| `tool:started` | A tool begins executing |
| `tool:finished` | A tool completes successfully |
| `tool:failed` | A tool execution fails |
| `approval:requested` | An approval request is created |
| `approval:granted` | The user approves an execution |
| `approval:rejected` | The user rejects an execution |
| `patch:generated` | A patch is created by a write operation |
| `patch:applied` | A patch is applied to the filesystem |
| `patch:rejected` | A patch is rejected by the user |
| `rollback:completed` | A snapshot is restored |
| `queue:enqueued` | A request is added to the queue |
| `queue:cancelled` | A queued request is cancelled |

## Event structure

```typescript
interface ExecutionEvent {
  id: string;
  type: ExecutionEventType;
  requestId?: string;
  toolId?: string;
  message: string;
  timestamp: string;
  details?: unknown;
}
```

## Subscribing

```typescript
import { eventBus } from "@/features/execution/events";

// Subscribe to a specific event type
const unsubscribe = eventBus.on("tool:finished", (event) => {
  console.log(`${event.toolId} finished: ${event.message}`);
});

// Subscribe to all events (wildcard)
eventBus.on("*", (event) => {
  logger.log(event.type, event.message);
});

// Unsubscribe
unsubscribe();
```

## Emitting

The Execution Engine emits events automatically. You can also emit manually:

```typescript
eventBus.emit("tool:started", {
  requestId: "exec_abc",
  toolId: "fs.write_file",
  message: "Started Write File",
});
```

## Event history

The bus keeps the last 500 events in memory:

```typescript
const recent = eventBus.getHistory("tool:finished", 20);
```

## Subscribers

### Logger
The Logger subscribes to `*` (all events) and records them as structured log entries:
- Level: `info` (normal), `warn`, `error` (failures/rejections)
- Filterable by level, type, or query
- Exportable as JSON

### Telemetry
The Telemetry collector subscribes to `tool:finished` and `tool:failed`:
- Aggregates per-tool: count, success rate, average duration
- Provides summary stats across all tools

### UI
The UI components (Execution Center, Approval Queue) subscribe to relevant events for real-time updates. In Phase 4, the UI polls the API; a future phase will add WebSocket-based real-time updates.

## Try it

Visit **Inspector → Logs** tab to see execution events mixed with other workspace events. The Logger captures everything automatically.
