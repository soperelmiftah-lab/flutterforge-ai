/**
 * @module features/autonomous/decision
 *
 * Decision Engine — chooses whether to reject, approve, request approval,
 * generate alternatives, or retry planning.
 */

import type { Decision, PatchCandidate, SimulationResult, ValidationResult } from "../types";

/** Make a decision based on simulation + validation + confidence. */
export function makeDecision(params: {
  candidate: PatchCandidate;
  simulation: SimulationResult;
  validation: ValidationResult;
  confidence: number;
}): Decision {
  const { candidate, simulation, validation, confidence } = params;

  // Reject if validation failed.
  if (!validation.valid) {
    return { action: "reject", reason: `Validation failed: ${validation.checks.filter((c) => !c.passed).map((c) => c.name).join(", ")}`, confidence, riskLevel: candidate.riskLevel };
  }

  // Reject if failure probability is too high.
  if (simulation.failureProbability > 0.5) {
    return { action: "generate-alternatives", reason: `Failure probability too high (${(simulation.failureProbability * 100).toFixed(0)}%)`, confidence, riskLevel: candidate.riskLevel };
  }

  // Auto-approve safe patches with high confidence.
  if (candidate.riskLevel === "safe" && confidence > 0.8) {
    return { action: "approve", reason: "Safe patch with high confidence — auto-approved", confidence, riskLevel: "safe" };
  }

  // Request approval for moderate/high risk.
  if (candidate.riskLevel === "moderate" || candidate.riskLevel === "high") {
    return { action: "request-approval", reason: `${candidate.riskLevel} risk patch requires manual approval`, confidence, riskLevel: candidate.riskLevel };
  }

  // Never auto-approve critical.
  if (candidate.riskLevel === "critical") {
    return { action: "request-approval", reason: "Critical risk — requires manual approval", confidence, riskLevel: "critical" };
  }

  // Retry if confidence is too low.
  if (confidence < 0.5) {
    return { action: "retry-planning", reason: "Confidence too low — re-planning", confidence, riskLevel: candidate.riskLevel };
  }

  return { action: "approve", reason: "Patch meets all criteria", confidence, riskLevel: candidate.riskLevel };
}
