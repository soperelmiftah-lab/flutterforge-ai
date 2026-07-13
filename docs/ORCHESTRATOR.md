# Orchestrator

The Orchestrator coordinates all agents. It NEVER executes tools directly (that's the Execution Engine's job). It only dispatches work, tracks progress, and handles retries/timeouts.

## Responsibilities

- **Dispatch** tasks to agents via the Scheduler
- **Track** agent status, task status, progress, errors
- **Handle** retries, timeouts, and failures
- **Evaluate** the plan after execution
- **Emit** timeline events for observability

## Execution flow

```
executePlan(plan)
    │
    ├─ Mark plan status: "executing"
    ├─ Update task statuses (pending → ready/blocked)
    │
    └─ Loop:
        ├─ scheduler.nextBatch(tasks, strategy)
        │   └─ Returns ready tasks (respecting concurrency + strategy)
        ├─ For each task in batch (parallel):
        │   ├─ Mark task: "running"
        │   ├─ Emit "task-started" timeline event
        │   ├─ Execute (via Execution Engine in future; simulated in Phase 5)
        │   ├─ Mark task: "completed" or "failed"
        │   ├─ Emit "task-completed" or "task-failed" event
        │   └─ Update dependent task statuses
        └─ Repeat until no tasks are running or ready
    │
    ├─ Evaluate plan (success rate, quality, confidence)
    └─ Mark plan status: "completed" or "failed"
```

## Scheduler

The Scheduler decides which tasks run next:

```typescript
const batch = scheduler.nextBatch(tasks, strategy);
// Returns up to `maxConcurrent` ready tasks
```

### Strategies

| Strategy | Behavior |
|----------|----------|
| `sequential` | One task at a time |
| `parallel` | Up to N concurrent |
| `hybrid` | Mix of parallel + sequential |
| `priority-based` | Critical tasks first |
| `risk-based` | High-risk operations isolated |
| `token-optimized` | Minimize context window usage |

### Controls

- `pause()` / `resume()` — pause/resume the scheduler
- `retry(taskId, maxRetries)` — retry a failed task
- `runningCount()` — how many tasks are currently running

## Safety

- The Orchestrator NEVER touches the filesystem
- All tool execution goes through the Execution Engine (Phase 4)
- The Execution Engine enforces permissions, approvals, and patches
- The Orchestrator only coordinates

## Evaluation

After execution, the Evaluation Engine assesses:

| Metric | How computed |
|--------|-------------|
| `successRate` | Tasks completed / total |
| `quality` | Avg of (1 - complexity_penalty) for completed tasks |
| `errorCount` | Failed task count |
| `retryCount` | Total retries |
| `estimateAccuracy` | Estimated / actual duration |
| `confidence` | successRate - error penalty |

## API

```bash
POST /api/v1/planner/execute
{ "planId": "plan_abc123" }
```
