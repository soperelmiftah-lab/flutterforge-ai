# Workflow Engine

Reusable, pre-defined workflows for common operations. Each workflow is a template of steps with assigned agents and required tools.

## Built-in workflows

| ID | Name | Steps | Icon |
|----|------|-------|------|
| `wf.flutter-screen` | Generate Flutter Screen | 5 | 📱 |
| `wf.crud` | Generate CRUD | 5 | 🔄 |
| `wf.refactor-widget` | Refactor Widget | 5 | ♻️ |
| `wf.analyze-project` | Analyze Project | 5 | 🔍 |
| `wf.fix-errors` | Fix Errors | 4 | 🐛 |
| `wf.rest-api` | Create REST API | 5 | 🌐 |
| `wf.authentication` | Create Authentication | 5 | 🔐 |
| `wf.dashboard` | Build Dashboard | 5 | 📊 |

## Workflow structure

```typescript
interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  steps: WorkflowStep[];
  estimatedDurationMs: number;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  agentId: string;           // which agent handles this step
  requiredTools: string[];   // Execution Engine tool ids
  dependsOn: string[];       // step ids that must complete first
  estimatedDurationMs: number;
}
```

## Example: Generate Flutter Screen

```
Step 1: Design screen structure      (UI Agent)         — no deps
Step 2: Generate screen widget       (Flutter Agent)    — depends on 1
Step 3: Add Riverpod provider        (Riverpod Agent)   — depends on 1
Step 4: Register route               (Flutter Agent)    — depends on 2
Step 5: Write widget tests           (Testing Agent)    — depends on 2
```

Steps 2 and 3 run in parallel (both depend only on 1). Steps 4 and 5 run after 2 completes.

## Using a workflow

```typescript
import { getWorkflow } from "@/features/planner/workflow";

const workflow = getWorkflow("wf.flutter-screen");
// Pass to the Orchestrator for execution
```

## Creating a custom workflow

Add to `src/features/planner/workflow/index.ts`:

```typescript
buildWorkflow(
  "wf.custom",
  "My Custom Workflow",
  "Description",
  "custom",
  "🔧",
  [
    { title: "Step 1", agentId: "agent.flutter", requiredTools: ["fs.create_file"], dependsOn: [] },
    { title: "Step 2", agentId: "agent.testing", requiredTools: ["fs.create_file"], dependsOn: [0] },
  ]
)
```

## API

```bash
GET /api/v1/planner/workflows
# Returns all 8 workflows
```

## UI

The Planner → Workflows tab lets you browse workflows, inspect steps, and see which agent + tools each step needs.
