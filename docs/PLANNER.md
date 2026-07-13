# Planner

The Planner is the intelligence layer that controls every AI Agent. It understands requests, creates execution plans, builds dependency graphs, schedules work, coordinates agents, monitors progress, and evaluates execution.

## Architecture

```
User Input
    │
    ▼
Intent Analyzer ─→ detects: question, bug-fix, feature, refactor, etc.
    │
    ▼
Goal Analyzer ─→ creates Goal with Objectives
    │
    ▼
Task Builder ─→ generates Tasks with dependencies, tools, complexity
    │
    ▼
Task Graph Builder ─→ builds DAG, computes critical path
    │
    ▼
Execution Strategy ─→ chooses: sequential, parallel, hybrid, priority, risk, token-optimized
    │
    ▼
Agent Router ─→ assigns tasks to agents based on capabilities + tools
    │
    ▼
Orchestrator ─→ coordinates execution via the Execution Engine (Phase 4)
    │
    ▼
Evaluation Engine ─→ assesses success, quality, confidence
    │
    ▼
Memory ─→ records history for future planning improvement
```

## The `plan()` API

```typescript
import { plan } from "@/features/planner/core";

const { intent, goal, plan } = plan("Add a login screen with email validation");
// intent.type = "generate-ui"
// goal.title = "Add a login screen with email validation"
// plan.tasks = [Design widget, Generate widget code, Add to exports]
// plan.strategy.kind = "sequential"
// plan.requiredAgents = ["agent.ui"]
```

## Intent types

14 intent types are detected from natural-language input:

| Type | Description |
|------|-------------|
| `question` | Asking for information |
| `bug-fix` | Fixing an error |
| `feature-request` | Adding new functionality |
| `refactor` | Restructuring code |
| `code-review` | Reviewing code |
| `generate-ui` | Creating widgets/screens |
| `generate-api` | Creating API endpoints |
| `generate-database` | Creating schemas/models |
| `generate-flutter-app` | Scaffolding an app |
| `analyze-project` | Inspecting structure |
| `explain-code` | Walking through code |
| `documentation` | Generating docs |
| `testing` | Writing tests |
| `deployment` | Building/deploying |

## Plan structure

```typescript
interface Plan {
  id: string;
  goalId: string;
  intentType: IntentType;
  tasks: Task[];           // with dependencies, priority, complexity
  graph: TaskGraph;        // DAG with critical path
  strategy: ExecutionStrategy;
  requiredAgents: string[];
  estimatedDurationMs: number;
  estimatedTokens: number;
  status: "draft" | "approved" | "executing" | "completed" | "failed";
}
```

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/planner/plan` | Create a plan from natural language |
| POST | `/api/v1/planner/execute` | Execute a plan |
| GET | `/api/v1/planner/tasks` | Get tasks from latest plan |
| GET | `/api/v1/planner/workflows` | List reusable workflows |
| GET | `/api/v1/planner/agents` | List registered agents |
| GET | `/api/v1/planner/timeline` | Get timeline events |
| GET | `/api/v1/planner/sessions` | List planning sessions |
| GET | `/api/v1/planner/metrics` | Get planner metrics |

## UI — 7 tabs

| Tab | Purpose |
|-----|---------|
| Dashboard | Plan a request, view intent/goal/plan, execute |
| Task Graph | Visual DAG with click-to-inspect |
| Workflows | Browse 8 reusable workflow templates |
| Agents | Browse 17 registered agents |
| Thinking | Reasoning timeline (12 phases) |
| Timeline | Event log with filters |
| Metrics | Planning + execution metrics |

See also: [ORCHESTRATOR.md](./ORCHESTRATOR.md), [AGENT_REGISTRY.md](./AGENT_REGISTRY.md), [TASK_GRAPH.md](./TASK_GRAPH.md), [WORKFLOW_ENGINE.md](./WORKFLOW_ENGINE.md), [THINKING_ENGINE.md](./THINKING_ENGINE.md), [TIMELINE.md](./TIMELINE.md).
