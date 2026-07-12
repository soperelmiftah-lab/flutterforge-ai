/**
 * @module features/planner/reasoning
 *
 * Reasoning — configurable depth for the thinking engine.
 * Fast / Balanced / Deep / Exhaustive.
 */

import type { ReasoningConfig, ReasoningDepth } from "../types";
import { defaultReasoningConfig } from "../thinking";

let activeConfig: ReasoningConfig = defaultReasoningConfig;

/** Get the active reasoning config. */
export function getReasoningConfig(): ReasoningConfig {
  return activeConfig;
}

/** Set the active reasoning config. */
export function setReasoningConfig(config: Partial<ReasoningConfig>): void {
  activeConfig = { ...activeConfig, ...config };
}

/** Set the reasoning depth. */
export function setDepth(depth: ReasoningDepth): void {
  activeConfig.depth = depth;
  // Adjust max steps based on depth.
  const stepsByDepth: Record<ReasoningDepth, number> = {
    fast: 4,
    balanced: 7,
    deep: 11,
    exhaustive: 12,
  };
  activeConfig.maxSteps = stepsByDepth[depth];
}

/** Get all reasoning depths (for UI). */
export function listDepths(): Array<{ depth: ReasoningDepth; label: string; description: string }> {
  return [
    { depth: "fast", label: "Fast", description: "Minimal reasoning — 4 phases" },
    { depth: "balanced", label: "Balanced", description: "Standard reasoning — 7 phases" },
    { depth: "deep", label: "Deep", description: "Thorough reasoning — 11 phases" },
    { depth: "exhaustive", label: "Exhaustive", description: "Maximum reasoning — 12 phases" },
  ];
}
