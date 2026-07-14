/**
 * @module features/autonomous/patch-planner
 *
 * Patch Planner — generates patch candidates with grouped edits, risk
 * estimates, affected files, dependencies, and expected outcomes.
 * Never writes files directly.
 */

import type { PatchCandidate, RepairPlan, Problem, RootCause } from "../types";
import { uid } from "@/lib/utils";

/** Generate repair plan with patch candidates. */
export function planRepair(problem: Problem, rootCause: RootCause): RepairPlan {
  const candidates = generateCandidates(problem, rootCause);
  return {
    id: uid("plan"),
    problemId: problem.id,
    rootCauseId: rootCause.id,
    candidates,
    selectedCandidateId: candidates[0]?.id,
    rationale: `Selected "${candidates[0]?.title}" as the primary candidate based on lowest risk and highest expected success.`,
  };
}

function generateCandidates(problem: Problem, rootCause: RootCause): PatchCandidate[] {
  const candidates: PatchCandidate[] = [];

  // Candidate 1: Direct fix.
  candidates.push({
    id: uid("patch"),
    title: `Direct fix: ${problem.title}`,
    description: `Apply a targeted fix to resolve the root cause: ${rootCause.rootCause}`,
    affectedFiles: problem.file ? [problem.file] : ["lib/main.dart"],
    riskLevel: problem.severity === "critical" ? "high" : "moderate",
    expectedOutcome: "Issue resolved with minimal changes",
    sideEffects: ["May require additional test updates"],
    failureProbability: 0.15,
    estimatedComplexity: problem.severity === "critical" ? "complex" : "moderate",
  });

  // Candidate 2: Alternative approach.
  candidates.push({
    id: uid("patch"),
    title: `Alternative approach: Refactor affected area`,
    description: `Refactor the affected code to prevent the issue from recurring`,
    affectedFiles: problem.file ? [problem.file, "lib/core/utils.dart"] : ["lib/main.dart", "lib/core/utils.dart"],
    riskLevel: "moderate",
    expectedOutcome: "Issue resolved with improved code structure",
    sideEffects: ["Larger changeset", "May affect dependent code"],
    failureProbability: 0.2,
    estimatedComplexity: "complex",
  });

  // Candidate 3: Safe fallback.
  candidates.push({
    id: uid("patch"),
    title: `Safe fallback: Add guard/check`,
    description: `Add a defensive check to prevent the error from occurring`,
    affectedFiles: problem.file ? [problem.file] : ["lib/main.dart"],
    riskLevel: "safe",
    expectedOutcome: "Error prevented, but root cause may persist",
    sideEffects: ["Does not fix the underlying issue"],
    failureProbability: 0.05,
    estimatedComplexity: "simple",
  });

  return candidates;
}

/** Select the best candidate based on risk + failure probability. */
export function selectBestCandidate(candidates: PatchCandidate[]): PatchCandidate {
  return candidates.sort((a, b) => {
    const riskRank = { safe: 0, moderate: 1, high: 2, critical: 3 };
    const aScore = riskRank[a.riskLevel] + a.failureProbability;
    const bScore = riskRank[b.riskLevel] + b.failureProbability;
    return aScore - bScore;
  })[0];
}
