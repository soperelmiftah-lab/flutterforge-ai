/**
 * @module features/autonomous
 *
 * Autonomous Engineering System — the intelligence layer that closes the
 * engineering loop. Observes, reasons, proposes fixes, simulates, validates,
 * and safely executes improvements.
 *
 * Pipeline:
 *   Problem → Analysis → Root Cause → Repair Plan → Simulation → Validation
 *   → Decision → Approval → Execution → Verification → Learning
 *
 * Nothing bypasses the Planner, Tool Intelligence, Execution Engine,
 * Approval System, or Rollback System.
 *
 * Sub-modules:
 *   types/          Core domain types
 *   engine/         Central orchestration engine
 *   coordinator/    High-level coordinator
 *   debugger/       Problem detection from multiple sources
 *   repair/         Repair strategies per problem category
 *   root-cause/     Root cause analyzer
 *   patch-planner/  Patch candidate generation
 *   simulation/     Dry-run patch simulation
 *   validation/     Pre-execution validation
 *   verification/   Before/after comparison
 *   regression/     Regression detection
 *   quality/        Quality scoring
 *   review/         Automated code review
 *   decision/       Decision engine (approve/reject/request)
 *   confidence/     Confidence scoring
 *   approval/       Approval system integration
 *   rollback/       Rollback system integration
 *   learning/       Learning from outcomes
 *   knowledge/      Known issue patterns
 *   history/        Action history
 *   sessions/       Session persistence
 *   metrics/        Aggregated metrics
 *   policies/       Safety policies
 */

export * from "./types";
export * from "./engine";
export * from "./coordinator";
export * from "./debugger";
export * from "./repair";
export * from "./root-cause";
export * from "./patch-planner";
export * from "./simulation";
export * from "./validation";
export * from "./verification";
export * from "./regression";
export * from "./quality";
export * from "./review";
export * from "./decision";
export * from "./confidence";
export * from "./approval";
export * from "./rollback";
export * from "./learning";
export * from "./knowledge";
export * from "./history";
export * from "./sessions";
export * from "./metrics";
export * from "./policies";
// Phase 11 — shared in-memory state + AI enhancement.
export * from "./state";
export { enhanceWithAI } from "./ai-analysis";
