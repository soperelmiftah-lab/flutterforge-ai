# Autonomous Engineering System

The intelligence layer that closes the engineering loop. Observes, reasons, proposes fixes, simulates, validates, and safely executes improvements. Nothing bypasses the Planner, Tool Intelligence, Execution Engine, Approval System, or Rollback System.

## Architecture

```
Planner → Tool Intelligence → Flutter Platform → Runtime Platform → Visual Runtime → Vision AI → Autonomous Engineering → Execution Engine
```

## Pipeline (10 stages)

```
Problem → Analysis → Root Cause → Repair Plan → Simulation → Validation → Approval → Execution → Verification → Learning
```

Each stage is tracked with status (pending/active/completed/failed/skipped), timestamps, and results.

## Modules (23)

| Module | Purpose |
|--------|---------|
| types/ | Core domain types (Problem, RootCause, PatchCandidate, RepairPlan, SimulationResult, etc.) |
| engine/ | Central orchestration engine — runs the full pipeline |
| coordinator/ | High-level entry point |
| debugger/ | Problem detection from analyzer, runtime, vision AI, console, build, user |
| repair/ | Repair strategies for 12 problem categories |
| root-cause/ | Root cause analyzer with contributing factors, evidence, alternatives |
| patch-planner/ | Patch candidate generation with risk, files, expected outcomes |
| simulation/ | Dry-run patch simulation with success/failure probability |
| validation/ | Pre-execution validation (compilation, analysis, layout, a11y, etc.) |
| verification/ | Before/after comparison to verify issue resolved |
| regression/ | Detect new issues, broken layouts, new warnings/errors |
| quality/ | Quality scoring (maintainability, complexity, performance, a11y, architecture) |
| review/ | Automated code review (code, Flutter, architecture, security, performance) |
| decision/ | Decision engine (reject/approve/request-approval/generate-alternatives/retry) |
| confidence/ | Confidence scoring with factors and reasoning |
| approval/ | Integrates with existing Execution Engine Approval System |
| rollback/ | Integrates with existing Execution Engine Rollback System |
| learning/ | Stores successful/rejected repairs, execution outcomes, common patterns |
| knowledge/ | 8 known Flutter issue patterns with solutions |
| history/ | Action history with success/confidence/rollback tracking |
| sessions/ | Session persistence (active/completed/failed/rolled-back) |
| metrics/ | Aggregated metrics (problems, repairs, success rate, confidence, rollbacks) |
| policies/ | Safety policies (auto-approve safe, require approval for moderate, etc.) |

## Safety guarantees

1. **Never silently modify projects** — all patches go through the pipeline
2. **Never bypass approval** — moderate/high/critical patches require manual approval
3. **Never skip rollback** — snapshots are created before execution, rollback on regression
4. **Never auto-approve high-risk** — policies prevent auto-approval of high/critical patches
5. **All actions observable** — pipeline steps are tracked with timestamps and results
6. **All actions auditable** — history, sessions, and learning records
7. **All actions reversible** — rollback plan built for every patch

## API endpoints (8)

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/v1/autonomous/analyze | Run full engineering pipeline |
| POST | /api/v1/autonomous/repair | Generate repair plan |
| POST | /api/v1/autonomous/simulate | Simulate a patch |
| POST | /api/v1/autonomous/verify | Verify repair + detect regressions |
| GET | /api/v1/autonomous/review | Automated code review + quality scores |
| GET | /api/v1/autonomous/history | Repair history |
| GET | /api/v1/autonomous/metrics | Aggregated metrics |
| GET | /api/v1/autonomous/sessions | Session list |

## UI — 9 panels

| Panel | Purpose |
|-------|---------|
| Autonomous Dashboard | Pipeline status, confidence, decision, before/after scores |
| Engineering Pipeline | Visual pipeline with 10 stages and status indicators |
| Root Cause | Root cause, contributing factors, evidence, alternatives |
| Patch Planner | Patch candidates with risk, files, expected outcomes |
| Simulation | Success/failure probability, validation checks, confidence factors |
| Verification | Before/after comparison, regression detection |
| Quality Review | Quality scores (maintainability, complexity, performance, a11y, architecture) + review findings |
| Repair History | Past repairs with success/confidence/rollback |
| Metrics | Aggregated metrics with common problem categories |
