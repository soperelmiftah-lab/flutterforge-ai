# Tool Chain

The Tool Chain Builder constructs execution pipelines from tool selections. Supports sequential, parallel, conditional, fallback, retry, and rollback patterns.

## Chain structure

```typescript
interface ToolChain {
  id: string;
  taskId: string;
  objective: string;
  steps: ChainStep[];
  totalEstimatedDurationMs: number;
  totalEstimatedTokens: number;
  riskScore: number;
  costEstimate: CostEstimate;
  rollbackStrategy: string;
  optimized: boolean;
}

interface ChainStep {
  id: string;
  toolId: string;
  toolName: string;
  type: "sequential" | "parallel" | "conditional" | "fallback" | "approval";
  parameters: Record<string, unknown>;
  dependsOn: string[];
  fallbacks: string[];
  requiresApproval: boolean;
  estimatedDurationMs: number;
  estimatedTokens: number;
  parallelGroup?: string;
  condition?: string;
}
```

## Step types

| Type | Description | Example |
|------|-------------|---------|
| `sequential` | Runs after the previous step | Read file → Write file |
| `parallel` | Runs concurrently with group members | Search files ∥ Search symbols |
| `conditional` | Runs only if a condition is met | Run tests if tests exist |
| `fallback` | Alternative if the primary fails | write_file → replace_range |
| `approval` | Requires user approval before running | Create file, Build APK |

## Example chain: Bug Fix

```
1. search.find_text (sequential, fallback: search.find_symbol)
       │
       ▼
2. fs.read_file (sequential)
       │
       ▼
3. fs.write_file (approval, fallback: editor.replace_range)
       │
       ▼
4. flutter.analyze (sequential)
```

## Chain templates

Each intent type has a pre-built chain template:

| Intent | Steps | Tools |
|--------|-------|-------|
| question | 2 | search → read |
| bug-fix | 4 | search → read → write(approval) → analyze |
| feature-request | 4 | search → create(approval) → create(approval, parallel) → test |
| generate-ui | 2 | create(approval) → write(approval) |
| deployment | 1 | build_apk(approval) |

## Building a chain

```typescript
import { buildChain } from "@/features/tool-intelligence/chains";

const chain = buildChain("task_1", "Add a login screen", "generate-ui");
```

## Rollback strategy

Each chain includes a rollback strategy:

- **Read-only chains**: "No rollback needed — chain is read-only."
- **Mutation chains**: "Rollback N filesystem mutation(s) via snapshot restore."

## API

```bash
POST /api/v1/tools/analyze
{ "objective": "Add a login screen", "intentType": "generate-ui" }

GET /api/v1/tools/chains
# Returns all built chains
```
