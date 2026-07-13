/**
 * @module features/autonomous/policies
 *
 * Policies — configurable safety limits for the autonomous system.
 */

import type { AutonomousPolicies } from "../types";

export const defaultPolicies: AutonomousPolicies = {
  autoApproveSafe: true,
  requireApprovalForModerate: true,
  neverAutoApproveHigh: true,
  maxRetries: 3,
  rollbackOnRegression: true,
  minConfidence: 0.5,
};

let active = defaultPolicies;

export function getPolicies(): AutonomousPolicies { return active; }
export function setPolicies(p: Partial<AutonomousPolicies>): void { active = { ...active, ...p }; }

/** Check if a patch can be auto-approved based on policies. */
export function canAutoApprove(riskLevel: "safe" | "moderate" | "high" | "critical", confidence: number): boolean {
  if (confidence < active.minConfidence) return false;
  if (riskLevel === "safe" && active.autoApproveSafe) return true;
  if (riskLevel === "moderate" && !active.requireApprovalForModerate) return true;
  return false;
}
