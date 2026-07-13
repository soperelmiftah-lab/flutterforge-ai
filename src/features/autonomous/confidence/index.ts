/**
 * @module features/autonomous/confidence
 *
 * Confidence Engine — computes repair confidence, risk, and expected success.
 */

import type { ConfidenceReport } from "../types";

/** Compute confidence from analysis factors. */
export function computeConfidence(params: {
  rootCauseConfidence: number;
  simulationSuccess: number;
  validationScore: number;
  hasEvidence: boolean;
  hasAlternatives: boolean;
}): ConfidenceReport {
  const factors = [
    { name: "Root Cause", weight: 0.3, value: params.rootCauseConfidence },
    { name: "Simulation", weight: 0.3, value: params.simulationSuccess },
    { name: "Validation", weight: 0.25, value: params.validationScore / 100 },
    { name: "Evidence", weight: 0.1, value: params.hasEvidence ? 1 : 0 },
    { name: "Alternatives", weight: 0.05, value: params.hasAlternatives ? 1 : 0 },
  ];

  const repairConfidence = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
  const expectedSuccess = Math.min(1, repairConfidence * 1.1);

  const riskLevel = repairConfidence > 0.8 ? "safe" : repairConfidence > 0.6 ? "moderate" : repairConfidence > 0.4 ? "high" : "critical";

  const reasoning = `Confidence based on ${factors.filter((f) => f.value > 0.5).length}/${factors.length} strong factors. ` +
    `Root cause: ${(params.rootCauseConfidence * 100).toFixed(0)}%, Simulation: ${(params.simulationSuccess * 100).toFixed(0)}%, Validation: ${params.validationScore}%.`;

  return {
    repairConfidence: Math.round(repairConfidence * 100) / 100,
    riskLevel: riskLevel as ConfidenceReport["riskLevel"],
    expectedSuccess: Math.round(expectedSuccess * 100) / 100,
    factors,
    reasoning,
  };
}
