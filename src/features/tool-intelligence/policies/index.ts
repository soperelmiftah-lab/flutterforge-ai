/**
 * @module features/tool-intelligence/policies
 *
 * Policies — configurable limits for the Tool Intelligence Layer.
 */

import type { ToolIntelligencePolicies } from "../types";

export const defaultPolicies: ToolIntelligencePolicies = {
  maxToolsPerChain: 10,
  maxRetries: 3,
  approvalPolicy: "risky-only",
  riskTolerance: "medium",
  simulationRequired: true,
  timeoutMs: 300000,
};

let activePolicies: ToolIntelligencePolicies = defaultPolicies;

export function getPolicies(): ToolIntelligencePolicies {
  return activePolicies;
}

export function setPolicies(policies: Partial<ToolIntelligencePolicies>): void {
  activePolicies = { ...activePolicies, ...policies };
}

export function resetPolicies(): void {
  activePolicies = defaultPolicies;
}

/** Check if simulation is required before execution. */
export function isSimulationRequired(): boolean {
  return activePolicies.simulationRequired;
}

/** Check if a risk level is within tolerance. */
export function isRiskWithinTolerance(riskScore: number): boolean {
  const thresholds = { low: 0.3, medium: 0.5, high: 0.8 };
  return riskScore <= thresholds[activePolicies.riskTolerance];
}

/** Check if a chain exceeds the max tools limit. */
export function exceedsMaxTools(stepCount: number): boolean {
  return stepCount > activePolicies.maxToolsPerChain;
}
