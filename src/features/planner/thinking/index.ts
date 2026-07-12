/**
 * @module features/planner/thinking
 *
 * Thinking Engine — generates an internal reasoning timeline for each
 * planning session. Shows the user (and logs) what the planner is "thinking"
 * at each phase.
 */

import type { ThinkingStep, ThinkingPhase, ReasoningConfig, IntentType } from "../types";
import { uid } from "@/lib/utils";

/** Default reasoning config. */
export const defaultReasoningConfig: ReasoningConfig = {
  depth: "balanced",
  maxSteps: 12,
  showReasoning: true,
};

/** Phase sequences per reasoning depth. */
const PHASE_SEQUENCES: Record<ReasoningConfig["depth"], ThinkingPhase[]> = {
  fast: ["understanding-request", "planning-tasks", "executing", "finished"],
  balanced: ["understanding-request", "analyzing-workspace", "planning-tasks", "selecting-agents", "executing", "evaluating", "finished"],
  deep: ["understanding-request", "analyzing-workspace", "searching-context", "planning-tasks", "selecting-agents", "selecting-tools", "estimating-complexity", "generating-workflow", "executing", "evaluating", "finished"],
  exhaustive: ["understanding-request", "analyzing-workspace", "searching-context", "planning-tasks", "selecting-agents", "selecting-tools", "estimating-complexity", "generating-workflow", "waiting-approval", "executing", "evaluating", "finished"],
};

/** Phase metadata. */
const PHASE_META: Record<ThinkingPhase, { title: string; description: string }> = {
  "understanding-request": { title: "Understanding request", description: "Parsing the user's intent" },
  "analyzing-workspace": { title: "Analyzing workspace", description: "Scanning project structure" },
  "searching-context": { title: "Searching context", description: "Finding relevant files and symbols" },
  "planning-tasks": { title: "Planning tasks", description: "Building the task graph" },
  "selecting-agents": { title: "Selecting agents", description: "Routing tasks to agents" },
  "selecting-tools": { title: "Selecting tools", description: "Choosing execution tools" },
  "estimating-complexity": { title: "Estimating complexity", description: "Assessing effort and risk" },
  "generating-workflow": { title: "Generating workflow", description: "Composing the execution plan" },
  "waiting-approval": { title: "Waiting for approval", description: "Awaiting user confirmation" },
  executing: { title: "Executing", description: "Running the plan" },
  evaluating: { title: "Evaluating", description: "Assessing results" },
  finished: { title: "Finished", description: "Plan complete" },
};

/** Generate thinking steps for a planning session. */
export function generateThinkingSteps(
  intentType: IntentType,
  config: ReasoningConfig = defaultReasoningConfig
): ThinkingStep[] {
  const phases = PHASE_SEQUENCES[config.depth];
  return phases.map((phase) => {
    const meta = PHASE_META[phase];
    return {
      id: uid("think"),
      phase,
      title: meta.title,
      description: meta.description,
      status: "pending",
    };
  });
}

/** Mark a thinking step as active. */
export function activateStep(step: ThinkingStep): ThinkingStep {
  return { ...step, status: "active", startedAt: new Date().toISOString() };
}

/** Mark a thinking step as completed. */
export function completeStep(step: ThinkingStep, output?: string): ThinkingStep {
  const completedAt = new Date().toISOString();
  const durationMs = step.startedAt ? Date.now() - new Date(step.startedAt).getTime() : 0;
  return { ...step, status: "completed", completedAt, durationMs, output };
}

/** Get all thinking phases (for UI). */
export function listPhases(): Array<{ phase: ThinkingPhase; title: string; description: string }> {
  return Object.entries(PHASE_META).map(([phase, meta]) => ({
    phase: phase as ThinkingPhase,
    title: meta.title,
    description: meta.description,
  }));
}
