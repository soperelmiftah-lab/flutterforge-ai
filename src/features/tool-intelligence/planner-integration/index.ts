/**
 * @module features/tool-intelligence/planner-integration
 *
 * Planner Integration — the Planner calls Tool Intelligence instead of the
 * Execution Engine directly. For each task, Tool Intelligence builds a
 * chain, simulates it, validates it, and hands the safe execution plan
 * to the Execution Engine.
 *
 * Flow:
 *   Planner task → analyzeCapabilities → buildChain → simulate → validate
 *     → optimize → recommend → hand to Execution Engine
 */

import type { ToolChain } from "../types";
import { analyzeCapabilities } from "../capabilities";
import { buildChain } from "../chains";
import { simulateChain } from "../simulation";
import { validateChain } from "../validator";
import { optimizeChain } from "../optimizer";
import { generateRecommendations } from "../recommendations";
import type { IntentType } from "@/features/planner/types";

export interface PlannerToolPlan {
  chain: ToolChain;
  simulation: ReturnType<typeof simulateChain>;
  validation: ReturnType<typeof validateChain>;
  optimizedChain: ToolChain;
  recommendations: ReturnType<typeof generateRecommendations>;
}

/** Build a complete tool plan for a planner task. */
export function buildToolPlan(
  taskId: string,
  objective: string,
  intentType: IntentType,
  requiredFiles: string[] = []
): PlannerToolPlan {
  // 1. Analyze capabilities.
  analyzeCapabilities(taskId, intentType, requiredFiles);

  // 2. Build the chain.
  const chain = buildChain(taskId, objective, intentType, requiredFiles);

  // 3. Simulate (dry run).
  const simulation = simulateChain(chain);

  // 4. Validate.
  const validation = validateChain(chain.steps);

  // 5. Optimize.
  const optimizedChain = optimizeChain(chain);

  // 6. Generate recommendations.
  const recommendations = generateRecommendations(chain);

  return {
    chain,
    simulation,
    validation,
    optimizedChain,
    recommendations,
  };
}

/** Quick summary for display. */
export function toolPlanSummary(plan: PlannerToolPlan): {
  steps: number;
  risk: string;
  duration: string;
  tokens: number;
  valid: boolean;
  simulated: boolean;
  optimized: boolean;
  recommendations: number;
} {
  const chain = plan.optimizedChain;
  const duration = chain.totalEstimatedDurationMs < 1000
    ? `${chain.totalEstimatedDurationMs}ms`
    : chain.totalEstimatedDurationMs < 60000
      ? `${(chain.totalEstimatedDurationMs / 1000).toFixed(1)}s`
      : `${(chain.totalEstimatedDurationMs / 60000).toFixed(1)}m`;
  return {
    steps: chain.steps.length,
    risk: chain.riskScore < 0.2 ? "low" : chain.riskScore < 0.5 ? "moderate" : "high",
    duration,
    tokens: chain.totalEstimatedTokens,
    valid: plan.validation.valid,
    simulated: plan.simulation.success,
    optimized: chain.optimized,
    recommendations: plan.recommendations.length,
  };
}
