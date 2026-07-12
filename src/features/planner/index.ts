/**
 * @module features/planner
 *
 * Planner, Orchestrator & Agent Operating System — the intelligence layer
 * that controls every future AI Agent.
 *
 * Pipeline:
 *   User → Intent Analyzer → Planner → Goal → Tasks → Graph → Strategy
 *     → Orchestrator → Agent Registry → Router → Scheduler
 *     → Execution Engine (Phase 4) → Results → Evaluator → Memory
 *
 * Sub-modules:
 *   types/        Intent, Goal, Task, Plan, Agent, Workflow, Timeline, Evaluation
 *   intent/       Intent analyzer (detects request type)
 *   goals/        Goal analyzer (intent → objectives)
 *   tasks/        Task builder (objectives → tasks with deps)
 *   graph/        Task graph builder (DAG) + dependency analyzer
 *   strategy/     Execution strategy (sequential/parallel/hybrid/...)
 *   registry/     Agent registry (17 placeholder agents)
 *   router/       Agent router (auto-routes tasks to agents)
 *   scheduler/    Task scheduler (priority, pause, resume, retry)
 *   orchestrator/ Orchestrator (coordinates agents, never executes)
 *   workflow/     Workflow engine (reusable templates)
 *   thinking/     Thinking engine (reasoning timeline)
 *   timeline/     Timeline event recorder
 *   evaluation/   Evaluation engine (success, quality, confidence)
 *   reasoning/    Reasoning config (fast/balanced/deep/exhaustive)
 *   memory/       Planner memory (history, performance)
 *   sessions/     Session manager (per-conversation state)
 *   policies/     Configurable limits
 *   metrics/      Aggregated metrics
 *   core.ts       The central plan() API
 */

export * from "./types";
export * from "./core";
export * from "./intent";
export * from "./goals";
export * from "./tasks";
export * from "./graph";
export * from "./strategy";
export * from "./registry";
export * from "./router";
export * from "./scheduler";
export * from "./orchestrator";
export * from "./workflow";
export * from "./thinking";
export * from "./timeline";
export * from "./evaluation";
export * from "./reasoning";
export * from "./memory";
export * from "./sessions";
export * from "./policies";
export * from "./metrics";
