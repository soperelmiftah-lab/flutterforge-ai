# Timeline

The Timeline records every planner and orchestrator event in chronological order. It's the observability layer for the Agent Operating System.

## Event types

| Type | When emitted |
|------|-------------|
| `intent-detected` | Intent analyzer detects the request type |
| `goal-created` | A goal is created from the intent |
| `plan-created` | A plan is generated |
| `task-scheduled` | A task is added to the queue |
| `task-started` | A task begins executing |
| `task-completed` | A task finishes successfully |
| `task-failed` | A task fails |
| `agent-assigned` | An agent is assigned to a task |
| `approval-requested` | Approval needed for a risky operation |
| `approval-granted` | User approves |
| `approval-rejected` | User rejects |
| `thinking-phase` | A thinking phase starts/completes |
| `workflow-started` | A workflow begins |
| `workflow-completed` | A workflow finishes |
| `evaluation-completed` | Plan evaluation is done |

## Event structure

```typescript
interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  taskId?: string;
  agentId?: string;
  metadata?: unknown;
}
```

## Emitting events

```typescript
import { emitTimeline } from "@/features/planner/timeline";

emitTimeline("task-started", "Started: Generate widget", taskId, agentId);
```

The Orchestrator emits events automatically during execution.

## Reading events

```typescript
import { getTimeline, timelineStats } from "@/features/planner/timeline";

const events = getTimeline(50);                    // last 50 events
const stats = timelineStats();                     // counts by type
const filtered = getTimeline(50, "task-completed"); // filtered by type
```

## UI — Timeline Viewer

The Planner → Timeline tab shows:

- **Filter buttons** — filter by event type
- **Event cards** — type badge, title, agent, timestamp
- **Refresh** — pull latest events
- **Scrollable list** — most recent first

## Session timeline

Each planning session has its own timeline snapshot:

```typescript
const session = getSession(sessionId);
session.timeline;  // TimelineEvent[]
```

## Retention

- The timeline keeps the last **1000 events** in memory
- Older events are dropped (FIFO)
- Sessions persist their timeline snapshot indefinitely

## API

```bash
GET /api/v1/planner/timeline
# Returns last 100 events + stats
```
