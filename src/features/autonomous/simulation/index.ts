/**
 * @module features/autonomous/simulation
 *
 * Simulation Engine — dry-runs patch candidates to predict outcomes,
 * side effects, and failure probability.
 */

import type { SimulationResult, PatchCandidate } from "../types";

/** Simulate a patch candidate (dry run — never modifies files). */
export function simulatePatch(candidate: PatchCandidate): SimulationResult {
  const warnings: string[] = [];

  if (candidate.riskLevel === "high" || candidate.riskLevel === "critical") {
    warnings.push("High-risk patch — requires manual approval before execution");
  }
  if (candidate.affectedFiles.length > 3) {
    warnings.push(`Patch affects ${candidate.affectedFiles.length} files — verify all changes`);
  }
  if (candidate.sideEffects.length > 2) {
    warnings.push("Multiple side effects detected — review before applying");
  }

  const successProbability = Math.max(0.1, 1 - candidate.failureProbability - (warnings.length * 0.05));

  return {
    patchId: candidate.id,
    dryRun: true,
    expectedOutcome: candidate.expectedOutcome,
    sideEffects: candidate.sideEffects,
    failureProbability: candidate.failureProbability,
    successProbability: Math.round(successProbability * 100) / 100,
    warnings,
    simulatedAt: new Date().toISOString(),
  };
}
