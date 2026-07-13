/**
 * @module features/planner/policies
 *
 * Policies — configurable limits for the planner and orchestrator.
 */

import type { PlannerPolicies } from "../types";

/** Default policies. */
export const defaultPolicies: PlannerPolicies = {
  maxParallelAgents: 4,
  maxRetries: 3,
  approvalPolicy: "risky-only",
  riskPolicy: "manual-review",
  tokenBudget: 100000,
  timeoutMs: 300000,
};

let activePolicies: PlannerPolicies = defaultPolicies;

/** Get active policies. */
export function getPolicies(): PlannerPolicies {
  return activePolicies;
}

/** Update policies. */
export function setPolicies(policies: Partial<PlannerPolicies>): void {
  activePolicies = { ...activePolicies, ...policies };
}

/** Reset to defaults. */
export function resetPolicies(): void {
  activePolicies = defaultPolicies;
}

/** Check if an action requires approval based on the policy. */
export function requiresApproval(riskLevel: "safe" | "moderate" | "high" | "critical"): boolean {
  switch (activePolicies.approvalPolicy) {
    case "never": return false;
    case "always": return true;
    case "risky-only": return riskLevel !== "safe";
  }
}

/** Check if a risk level is allowed. */
export function isRiskAllowed(riskLevel: "safe" | "moderate" | "high" | "critical"): boolean {
  switch (activePolicies.riskPolicy) {
    case "allow-all": return true;
    case "block-critical": return riskLevel !== "critical";
    case "manual-review": return true; // allowed, but needs review
  }
}
