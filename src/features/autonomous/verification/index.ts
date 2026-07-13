/**
 * @module features/autonomous/verification
 *
 * Verification Engine — compares before/after state to verify the issue
 * is resolved with no regressions.
 */

import type { VerificationResult } from "../types";

/** Verify the repair result. */
export function verifyRepair(params: {
  beforeScore: number;
  afterScore: number;
  beforeIssueCount: number;
  afterIssueCount: number;
  regressions: string[];
}): VerificationResult {
  const issueResolved = params.afterIssueCount < params.beforeIssueCount;
  const performanceMaintained = params.afterScore >= params.beforeScore * 0.95;
  const hasRegressions = params.regressions.length > 0;

  const summary = issueResolved && !hasRegressions
    ? `Issue resolved. Score: ${params.beforeScore} → ${params.afterScore}. No regressions.`
    : hasRegressions
      ? `Issue ${issueResolved ? "resolved" : "partially resolved"}, but ${params.regressions.length} regression(s) detected.`
      : `Issue ${issueResolved ? "resolved" : "not fully resolved"}. Score: ${params.beforeScore} → ${params.afterScore}.`;

  return {
    issueResolved,
    regressions: params.regressions,
    performanceMaintained,
    beforeScore: params.beforeScore,
    afterScore: params.afterScore,
    summary,
  };
}
