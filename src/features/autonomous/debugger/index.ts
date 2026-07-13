/**
 * @module features/autonomous/debugger
 *
 * Debugger — analyzes problems from multiple sources (analyzer, runtime,
 * vision AI, console, build, user) and structures them for the engine.
 */

import type { Problem, ProblemCategory } from "../types";
import { uid } from "@/lib/utils";

/** Create a problem from various sources. */
export function createProblem(params: {
  category: ProblemCategory;
  title: string;
  description: string;
  severity: Problem["severity"];
  source: Problem["source"];
  file?: string;
  line?: number;
  evidence?: string[];
}): Problem {
  return {
    id: uid("problem"),
    ...params,
    evidence: params.evidence ?? [],
  };
}

/** Detect problems from analysis results. */
export function detectFromAnalysis(params: {
  errorCount: number;
  warningCount: number;
  diagnostics: Array<{ severity: string; code: string; message: string; file: string; line: number }>;
}): Problem[] {
  return params.diagnostics
    .filter((d) => d.severity === "error")
    .map((d) => createProblem({
      category: "analysis-error",
      title: d.code,
      description: d.message,
      severity: "high",
      source: "analyzer",
      file: d.file,
      line: d.line,
      evidence: [`${d.file}:${d.line} — ${d.message}`],
    }));
}

/** Detect problems from runtime exceptions. */
export function detectFromConsole(params: {
  errorCount: number;
  errors: Array<{ message: string; stackTrace?: string }>;
}): Problem[] {
  return params.errors.map((e) => createProblem({
    category: "runtime-exception",
    title: e.message.slice(0, 60),
    description: e.message,
    severity: "critical",
    source: "console",
    evidence: [e.message, e.stackTrace ?? ""].filter(Boolean),
  }));
}
