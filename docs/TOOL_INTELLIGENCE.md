# Tool Intelligence

The Tool Intelligence Layer decides **HOW** work is executed. The Planner decides **WHAT** to do; Tool Intelligence builds the execution strategy — selecting the best tools, building chains, simulating outcomes, estimating costs, validating, managing recovery, and optimizing.

## Architecture

```
Planner (WHAT)
    │
    ▼
Tool Intelligence (HOW)
    │
    ├─ Capability Analyzer ─→ what capabilities are needed?
    ├─ Tool Selector ─→ which tools best provide those capabilities?
    ├─ Chain Builder ─→ build a pipeline (sequential/parallel/fallback)
    ├─ Validator ─→ are params, perms, deps valid?
    ├─ Simulation Engine ─→ dry-run: what will happen?
    ├─ Risk Analyzer ─→ how risky is this chain?
    ├─ Cost Estimator ─→ how much time/tokens/patches?
    ├─ Optimizer ─→ can we do it faster/cheaper/safer?
    ├─ Recommendations ─→ suggest better alternatives
    ├─ Recovery Engine ─→ what if a tool fails?
    └─ Negotiation ─→ flutter analyze vs dart analyze?
          │
          ▼
    Execution Engine (executes the safe plan)
```

## The `buildToolPlan()` API

```typescript
import { buildToolPlan } from "@/features/tool-intelligence/planner-integration";

const plan = buildToolPlan("task_1", "Add a login screen", "generate-ui");
// plan.chain — the tool chain with steps, risk, cost
// plan.simulation — dry-run predictions
// plan.validation — parameter/permission/dependency checks
// plan.optimizedChain — optimized version
// plan.recommendations — safer/faster/cheaper suggestions
```

## Key principles

1. **Agents never select tools manually** — they declare objectives; Tool Intelligence builds the strategy
2. **Never modify the project during simulation** — dry-run mode predicts without touching files
3. **Always validate before execution** — parameters, permissions, dependencies, circular deps
4. **Recovery is automatic** — retry, alternative tool, rollback, skip, or escalate
5. **Optimization is continuous** — fewer tools, less time, fewer tokens, lower risk

## API endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/tools/analyze` | Build a tool chain for an objective |
| POST | `/api/v1/tools/select` | Select the best tool for a capability |
| POST | `/api/v1/tools/simulate` | Simulate a chain (dry run) |
| POST | `/api/v1/tools/optimize` | Optimize a chain |
| POST | `/api/v1/tools/recover` | Create/execute a recovery plan |
| GET | `/api/v1/tools/chains` | List all built chains |
| GET | `/api/v1/tools/recommendations` | Get recommendations |
| GET | `/api/v1/tools/metrics` | Get Tool Intelligence metrics |

## UI — 7 tabs

| Tab | Purpose |
|-----|---------|
| Dashboard | Analyze an objective, view chain + metrics + recommendations |
| Chain Viewer | Inspect chain steps, dependencies, fallbacks, parallel groups |
| Simulation | Dry-run predictions: outputs, patches, duration, risk, warnings |
| Recovery | Recovery strategies: retry, alternative, rollback, skip, escalate |
| Optimization | Compare original vs optimized chain |
| Recommendations | Safer, faster, cheaper chain suggestions |
| Risk Dashboard | Risk by dimension: filesystem, terminal, flutter, git, network |

See also: [TOOL_SELECTOR.md](./TOOL_SELECTOR.md), [TOOL_CHAIN.md](./TOOL_CHAIN.md), [SIMULATION_ENGINE.md](./SIMULATION_ENGINE.md), [RECOVERY_ENGINE.md](./RECOVERY_ENGINE.md), [OPTIMIZATION_ENGINE.md](./OPTIMIZATION_ENGINE.md), [RISK_ENGINE.md](./RISK_ENGINE.md).
