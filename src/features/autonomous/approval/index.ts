/**
 * @module features/autonomous/approval
 *
 * Approval — integrates with the existing Execution Engine Approval System.
 * Provides patch preview, diff preview, risk summary, and confidence.
 */

import type { PatchCandidate, SimulationResult, ConfidenceReport } from "../types";

export interface ApprovalRequest {
  patchId: string;
  title: string;
  description: string;
  riskSummary: string;
  confidenceSummary: string;
  affectedFiles: string[];
  expectedOutcome: string;
  sideEffects: string[];
}

/** Build an approval request for the existing Approval System. */
export function buildApprovalRequest(
  candidate: PatchCandidate,
  simulation: SimulationResult,
  confidence: ConfidenceReport
): ApprovalRequest {
  return {
    patchId: candidate.id,
    title: candidate.title,
    description: candidate.description,
    riskSummary: `Risk: ${candidate.riskLevel.toUpperCase()} | Failure probability: ${(simulation.failureProbability * 100).toFixed(0)}% | Success probability: ${(simulation.successProbability * 100).toFixed(0)}%`,
    confidenceSummary: `Repair confidence: ${(confidence.repairConfidence * 100).toFixed(0)}% | Expected success: ${(confidence.expectedSuccess * 100).toFixed(0)}% | Risk level: ${confidence.riskLevel}`,
    affectedFiles: candidate.affectedFiles,
    expectedOutcome: candidate.expectedOutcome,
    sideEffects: candidate.sideEffects,
  };
}
