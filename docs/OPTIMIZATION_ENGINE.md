# Optimization Engine

The Optimization Engine reduces tool count, parallelizes independent steps, minimizes token usage, and reduces context overhead.

## Optimization strategies

### 1. Remove redundant steps
Consecutive duplicate tool calls (same toolId + parameters) are removed.

### 2. Parallelize independent steps
Steps that share the same dependency and are read-only are grouped into parallel groups. The optimizer takes `max(duration)` instead of `sum(duration)` for parallel groups.

### 3. Merge consecutive reads
Consecutive `fs.read_file` calls with the same dependency are merged.

## Comparing chains

```typescript
import { optimizeChain, compareChains } from "@/features/tool-intelligence/optimizer";

const optimized = optimizeChain(original);
const diff = compareChains(original, optimized);
// {
//   timeSavedMs: 5000,
//   tokensSaved: 200,
//   riskReduced: 0.1,
//   stepsReduced: 1
// }
```

## What gets optimized

| Metric | How |
|--------|-----|
| Time | Parallelize reads, remove duplicates |
| Tokens | Remove redundant steps |
| Risk | Fewer mutations = lower risk |
| Steps | Merge consecutive operations |

## API

```bash
POST /api/v1/tools/optimize
{ "chainId": "chain_abc123" }
# Returns optimized chain + comparison
```

## UI

The **Optimization Panel** tab shows:
- Original vs optimized step count
- Time saved, tokens saved
- The optimized chain with parallel groups highlighted
