/**
 * @module features/autonomous/rollback
 *
 * Rollback — integrates with the existing Execution Engine Rollback System.
 * Provides snapshot, undo, redo, and recovery.
 */

export interface RollbackPlan {
  snapshotRequired: boolean;
  affectedFiles: string[];
  recoveryStrategy: string;
}

/** Build a rollback plan for a patch. */
export function buildRollbackPlan(affectedFiles: string[], riskLevel: string): RollbackPlan {
  return {
    snapshotRequired: riskLevel !== "safe",
    affectedFiles,
    recoveryStrategy: riskLevel === "critical"
      ? "Full snapshot restore required — all affected files will be reverted"
      : riskLevel === "high"
        ? "Snapshot restore for affected files with verification"
        : "Standard rollback via Execution Engine snapshots",
  };
}

/** Check if rollback should be triggered. */
export function shouldRollback(params: {
  hasRegressions: boolean;
  issueResolved: boolean;
  rollbackOnRegression: boolean;
}): boolean {
  if (params.rollbackOnRegression && params.hasRegressions) return true;
  if (!params.issueResolved && params.rollbackOnRegression) return true;
  return false;
}
