/**
 * @module features/tool-intelligence
 *
 * Tool Intelligence Layer — decides HOW work is executed. The Planner
 * decides WHAT to do; Tool Intelligence builds the execution strategy.
 *
 * Pipeline:
 *   Planner task → Capability Analyzer → Tool Selector → Chain Builder
 *     → Validator → Simulation → Risk Analyzer → Cost Estimator
 *     → Optimizer → Recommendations → Recovery Plan → Execution Engine
 *
 * Sub-modules:
 *   types/                  Core domain types
 *   capabilities/           Capability analyzer (task → required capabilities)
 *   selector/               Tool selector (best tool per capability)
 *   chains/                 Tool chain builder (sequential/parallel/fallback)
 *   optimizer/              Execution optimizer (fewer tools, less time)
 *   validator/              Tool validator (params, perms, deps, cycles)
 *   simulation/             Simulation engine (dry-run predictions)
 *   recovery/               Recovery engine (retry/alternative/rollback/skip)
 *   cost/                   Cost estimator (time, tokens, patches)
 *   risk/                   Risk analyzer (6 dimensions)
 *   policies/               Configurable limits
 *   recommendations/        Recommendation engine (safer/faster/cheaper)
 *   negotiation/            Tool negotiator (choose between alternatives)
 *   learning/               Learning store (success/failure history)
 *   metrics/                Aggregated metrics
 *   planner-integration/    Planner → Tool Intelligence bridge
 */

export * from "./types";
export * from "./capabilities";
export * from "./selector";
export * from "./chains";
export * from "./optimizer";
export * from "./validator";
export * from "./simulation";
export * from "./recovery";
export * from "./cost";
export * from "./risk";
export * from "./policies";
export * from "./recommendations";
export * from "./negotiation";
export * from "./learning";
export * from "./metrics";
export * from "./planner-integration";
