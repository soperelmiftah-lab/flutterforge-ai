# Risk Engine

The Risk Analyzer evaluates tool chain risk across 6 dimensions: filesystem, terminal, flutter, git, network, and project impact.

## Risk dimensions

| Dimension | Weight | What increases it |
|-----------|--------|-------------------|
| Filesystem | 25% | write, create, delete operations |
| Terminal | 20% | terminal.execute, kill |
| Flutter | 15% | flutter.build, flutter.run |
| Git | 15% | git.reset, git.checkout |
| Network | 10% | network.fetch |
| Project Impact | 15% | Number of approval-required steps |

## Risk levels

| Score | Level | Color | Approval |
|-------|-------|-------|----------|
| 0.0–0.2 | Safe | Emerald | No |
| 0.2–0.4 | Moderate | Amber | Yes |
| 0.4–0.7 | High | Orange | Yes |
| 0.7–1.0 | Critical | Rose | Yes |

## Computing risk

```typescript
import { analyzeChainRisk, analyzeToolRisk } from "@/features/tool-intelligence/risk";

// Single tool
const toolRisk = analyzeToolRisk(tool);
// 0.1 (safe), 0.4 (moderate), 0.7 (high), 0.9 (critical)

// Full chain
const chainRisk = analyzeChainRisk(steps);
// {
//   overall: 0.24,
//   filesystem: 0.5,
//   terminal: 0.1,
//   flutter: 0.1,
//   git: 0.1,
//   network: 0.1,
//   projectImpact: 0.3,
//   level: "moderate",
//   factors: ["High-risk filesystem operation: fs.delete_file"]
// }
```

## Risk factors

The analyzer identifies specific risk factors:
- "High-risk filesystem operation: fs.delete_file"
- "Terminal execution: terminal.execute"
- "Flutter build: flutter.build_apk"
- "Destructive git operation: git.reset"

## Policies

Risk tolerance is configurable:

| Tolerance | Max risk score |
|-----------|---------------|
| Low | 0.3 |
| Medium | 0.5 |
| High | 0.8 |

```typescript
import { isRiskWithinTolerance } from "@/features/tool-intelligence/policies";
isRiskWithinTolerance(0.4); // true if tolerance is medium or high
```

## UI

The **Risk Dashboard** tab shows:
- Overall risk score with color-coded bar
- Risk by dimension (bar chart)
- Risk factors (specific warnings)
