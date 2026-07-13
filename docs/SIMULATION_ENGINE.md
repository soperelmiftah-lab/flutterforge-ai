# Simulation Engine

The Simulation Engine runs a dry-run of a tool chain — predicting outputs, patches, duration, risk, and approval requirements **without modifying the project**.

## How it works

```
Tool Chain
    │
    ▼
simulateChain(chain)
    │
    ├─ For each step:
    │   ├─ Predict output (based on tool category)
    │   ├─ Predict patches (lines added/removed for write ops)
    │   ├─ Accumulate duration + tokens
    │   └─ Check approval requirements
    │
    ├─ Adjust for parallel groups (take max time, not sum)
    │
    └─ Return SimulationResult
```

## Simulation result

```typescript
interface SimulationResult {
  chainId: string;
  dryRun: true;              // always true — never modifies
  predictedOutputs: Array<{ stepId, toolId, predictedOutput }>;
  predictedPatches: Array<{ stepId, path, linesAdded, linesRemoved }>;
  predictedDurationMs: number;
  predictedTokens: number;
  predictedRisk: number;
  approvalRequired: boolean;
  approvalSteps: string[];
  warnings: string[];
  success: boolean;
}
```

## Warnings

The simulation warns about:
- **Unimplemented tools** — execution will fail
- **Risky operations without fallbacks** — no recovery path
- **Missing parameters** — validation will fail

## Predictions

### Output prediction

| Tool category | Predicted output |
|--------------|-----------------|
| filesystem (read) | "File content (predicted)" |
| filesystem (list) | "Directory listing (predicted)" |
| filesystem (write/create) | "File created/modified (predicted)" |
| search | "Search results (predicted)" |
| flutter | "Flutter command output (predicted)" |
| git | "Git command output (predicted)" |

### Patch prediction

For write/create/insert/replace operations, the simulation predicts:
- **Lines added**: based on content length or tool type
- **Lines removed**: based on operation type (delete = 100, replace = 3)

## API

```bash
POST /api/v1/tools/simulate
{ "chainId": "chain_abc123" }
```

## UI

The **Simulation Panel** tab shows:
- Predicted duration, tokens, risk, approval required
- Warnings (if any)
- Predicted outputs per step
- Predicted patches with +/- line counts
