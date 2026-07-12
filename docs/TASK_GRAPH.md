# Task Graph

The Task Graph represents work as a Directed Acyclic Graph (DAG). Each task has dependencies, and the graph computes the critical path, blocked tasks, and execution order.

## Structure

```typescript
interface TaskGraph {
  tasks: Map<string, Task>;
  edges: Array<{ from: string; to: string }>;  // dependency → dependent
  criticalPath: string[];                        // longest chain
  builtAt: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  parentId?: string;
  subtaskIds: string[];
  dependsOn: string[];      // must complete first
  dependents: string[];     // depend on this task
  status: TaskStatus;
  priority: TaskPriority;
  complexity: ComplexityLevel;
  estimatedDurationMs: number;
  requiredTools: string[];
  assignedAgentId?: string;
  progress: number;          // 0-100
}
```

## Task statuses

| Status | Meaning |
|--------|---------|
| `pending` | Not yet processed |
| `blocked` | Has unmet dependencies |
| `ready` | All deps completed, ready to run |
| `scheduled` | Queued for execution |
| `running` | Currently executing |
| `completed` | Finished successfully |
| `failed` | Execution failed |
| `skipped` | Skipped (e.g., condition not met) |
| `cancelled` | Cancelled by user/agent |

## Dependency analysis

```typescript
import { findBlocked, findReady, findIndependent, detectCircular, topologicalOrder } from "@/features/planner/graph";

findBlocked(tasks);        // tasks with unmet deps
findReady(tasks);          // tasks ready to run
findIndependent(tasks);    // no deps, no dependents
detectCircular(tasks);     // circular dependency cycles
topologicalOrder(graph);   // execution order
```

## Critical path

The critical path is the longest chain of dependencies — it determines the minimum execution time:

```typescript
const criticalPath = computeCriticalPath(tasks);
// ["task_1", "task_3", "task_5"]  ← these must run sequentially
```

## Execution strategies

| Strategy | When used |
|----------|-----------|
| `sequential` | Linear dependencies |
| `parallel` | Multiple independent tasks |
| `hybrid` | Mix of independent + dependent |
| `priority-based` | Critical tasks present |
| `risk-based` | High-risk operations (delete, build) |
| `token-optimized` | Large plans (>8 tasks) |

## Task Graph Viewer UI

The Planner → Task Graph tab renders the DAG as an SVG:

- **Nodes** — rectangles with task title, status, priority
- **Edges** — arrows showing dependencies
- **Click a node** — see details (status, complexity, agent, tools, deps)
- **Color coding** — selected node highlighted in emerald

## Complexity levels

| Level | Penalty | Examples |
|-------|---------|----------|
| `trivial` | 0 | Read file, list directory |
| `simple` | 0.05 | Search, compose answer |
| `moderate` | 0.1 | Write file, apply fix |
| `complex` | 0.2 | Generate feature, create service |
| `very-complex` | 0.3 | Build APK, full refactor |
