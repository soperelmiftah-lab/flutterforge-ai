# Tool Selector

The Tool Selector automatically chooses the best tools for a task based on 7 criteria: capability, safety, performance, token cost, reliability, and risk.

## Selection criteria

| Criterion | Weight | How scored |
|-----------|--------|-----------|
| Capability | 20% | Does the tool provide the required capability? |
| Safety | 25% | Lower risk level = higher safety |
| Performance | 15% | Shorter timeout = faster |
| Token cost | 15% | Fewer estimated tokens = higher score |
| Reliability | 15% | Implemented tools score higher |
| Risk (inverted) | 10% | Lower risk = higher score |

## How it works

```typescript
import { selectTool } from "@/features/tool-intelligence/selector";

// Select the best tool for "read" capability
const selection = selectTool("read");
// {
//   toolId: "fs.read_file",
//   toolName: "Read File",
//   score: 0.9,
//   criteria: { capability: 1, safety: 0.9, performance: 0.98, ... },
//   rationale: "Read File selected for high safety, fast execution, reliable.",
//   alternatives: ["fs.list_directory", "search.find_text"]
// }

// Select with preferences
const safe = selectTool("write", { preferSafety: true });
const fast = selectTool("search", { preferSpeed: true });
```

## Capability mapping

Tools are mapped to capabilities based on their id:

| Tool pattern | Capabilities |
|-------------|-------------|
| `*.read_*`, `*.list_*` | read, list |
| `*.write_*`, `*.create_*`, `*.insert_*`, `*.replace_*` | write, create |
| `*.delete_*` | delete |
| `*.search.*`, `*.find_*` | search |
| `*.analyze` | analyze |
| `*.test` | test |
| `*.build_*` | build, deploy |
| `*.format_*` | format |

## Intent → capability requirements

Each intent type maps to required capabilities:

| Intent | Required capabilities |
|--------|----------------------|
| question | search, read |
| bug-fix | search, read, write, analyze |
| feature-request | create, write, search, test |
| refactor | read, write, analyze, search |
| generate-ui | create, write, search |
| analyze-project | list, search, read, analyze |
| deployment | build, deploy |

## API

```bash
POST /api/v1/tools/select
{ "capability": "read" }
# or
{ "capabilities": ["read", "search", "write"] }
```
