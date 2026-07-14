/**
 * @module features/vision-ai
 *
 * Vision AI & Autonomous UI Analysis Platform — transforms screenshots,
 * widget trees, render trees, layout reports, runtime logs, and visual
 * sessions into structured UI understanding with actionable recommendations.
 *
 * Pipeline:
 *   VisionInput → Screen Understanding → Layout Analysis → Widget Analysis
 *     → Design Analysis → Accessibility → Performance → Responsive
 *     → Issue Engine → Recommendation Engine → Confidence → Report
 *
 * Sub-modules:
 *   types/                  Core domain types
 *   analysis/               Accessibility, Performance, Responsive analysis
 *   screen-understanding/   Screen type + element detection
 *   layout-analysis/        Layout issue detection
 *   widget-analysis/        Widget hierarchy analysis
 *   design-analysis/        Material 3 / design quality evaluation
 *   comparison/             Screenshot comparison engine
 *   heuristics/             Rule-based analysis heuristics
 *   issues/                 Issue categorization engine
 *   recommendations/        Recommendation generation engine
 *   confidence/             Confidence scoring engine
 *   reports/                Report engine (central Vision Engine)
 *   sessions/               Analysis session persistence
 *   history/                Analysis history
 *   metrics/                Aggregated metrics
 *   knowledge/              Material 3 + Flutter best practices knowledge base
 *   policies/               Configurable limits
 */

export * from "./types";
export * from "./analysis";
export * from "./screen-understanding";
export * from "./layout-analysis";
export * from "./widget-analysis";
export * from "./design-analysis";
export * from "./comparison";
export * from "./heuristics";
export * from "./issues";
export * from "./recommendations";
export * from "./confidence";
export * from "./reports";
export * from "./sessions";
export * from "./history";
export * from "./metrics";
export * from "./knowledge";
export * from "./policies";
// Phase 10 — shared in-memory state + AI enhancement.
export * from "./state";
export { enhanceWithAI } from "./ai-analysis";
