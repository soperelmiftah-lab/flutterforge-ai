/**
 * @module features/debug
 *
 * Debug Engine — agents & tooling that find and fix issues. Planned (Phase 4):
 *  - Static analysis (dart analyze, custom lint rules)
 *  - Null-safety migration assistant
 *  - Widget tree inspector integration
 *  - Performance profiling (devtools bridge)
 *  - Automated bug-fix agent
 *
 * Phase 1: contract only.
 */

export type DiagnosticSeverity = "error" | "warning" | "info";

export interface Diagnostic {
  id: string;
  projectId: string;
  file: string;
  line: number;
  column: number;
  severity: DiagnosticSeverity;
  code: string;
  message: string;
  /** Suggested fix, if the agent can produce one */
  fix?: { description: string; patch: string };
}

/** Run static analysis on a project. NOT IMPLEMENTED in Phase 1. */
export async function analyzeProject(_projectId: string): Promise<Diagnostic[]> {
  throw new Error("Debug engine is not implemented in Phase 1. Arrives in Phase 4.");
}

/** Ask the debug agent to propose a fix for a diagnostic. NOT IMPLEMENTED in Phase 1. */
export async function proposeFix(_diagnosticId: string): Promise<Diagnostic["fix"]> {
  throw new Error("Debug agent is not implemented in Phase 1. Arrives in Phase 4.");
}
