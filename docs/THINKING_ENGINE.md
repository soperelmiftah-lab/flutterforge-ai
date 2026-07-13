# Thinking Engine

The Thinking Engine generates an internal reasoning timeline for each planning session. It shows what the planner is "thinking" at each phase.

## Reasoning phases

12 phases, executed in order based on the reasoning depth:

| Phase | Description |
|-------|-------------|
| `understanding-request` | Parse the user's intent |
| `analyzing-workspace` | Scan project structure |
| `searching-context` | Find relevant files and symbols |
| `planning-tasks` | Build the task graph |
| `selecting-agents` | Route tasks to agents |
| `selecting-tools` | Choose execution tools |
| `estimating-complexity` | Assess effort and risk |
| `generating-workflow` | Compose the execution plan |
| `waiting-approval` | Await user confirmation |
| `executing` | Run the plan |
| `evaluating` | Assess results |
| `finished` | Plan complete |

## Reasoning depths

| Depth | Phases | When to use |
|-------|--------|-------------|
| `fast` | 4 | Quick questions, simple lookups |
| `balanced` | 7 | Default — most requests |
| `deep` | 11 | Complex features, refactoring |
| `exhaustive` | 12 | Critical operations, full analysis |

## Configuration

```typescript
import { setDepth, getReasoningConfig } from "@/features/planner/reasoning";

setDepth("deep");
// { depth: "deep", maxSteps: 11, showReasoning: true }
```

## Thinking steps

```typescript
interface ThinkingStep {
  id: string;
  phase: ThinkingPhase;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  output?: string;
}
```

## Generating thinking steps

```typescript
import { generateThinkingSteps } from "@/features/planner/thinking";

const steps = generateThinkingSteps(intentType, config);
// Returns an array of ThinkingStep objects, all with status "pending"
```

## Thinking Panel UI

The Planner → Thinking tab displays the reasoning timeline:

- **Numbered steps** with phase badges
- **Status indicators**: pending (number), active (pulsing dot), completed (✓)
- **Vertical connector lines** showing the sequence
- **Output** for each step (when available)

## Integration with sessions

Each planning session stores its thinking steps:

```typescript
const session = createSession(intent, goal, thinkingSteps);
// session.thinkingSteps = [...]
```

As the plan executes, steps transition from `pending` → `active` → `completed`.
