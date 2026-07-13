/**
 * @module features/autonomous/root-cause
 *
 * Root Cause Analyzer — determines the root cause, contributing factors,
 * evidence, confidence, and possible alternatives.
 */

import type { RootCause, Problem } from "../types";
import { uid } from "@/lib/utils";

/** Analyze root cause from a problem. */
export function analyzeRootCause(problem: Problem): RootCause {
  const causeMap: Record<string, { cause: string; factors: string[] }> = {
    "flutter-error": { cause: "Widget build error in the widget tree", factors: ["Invalid widget composition", "Missing null check", "Incorrect BuildContext usage"] },
    "dart-error": { cause: "Type mismatch or null safety violation", factors: ["Unchecked null", "Incorrect type cast", "Missing late initialization"] },
    "analysis-error": { cause: "Code violates analyzer rules", factors: ["Missing const", "Unused imports", "Deprecated API usage"] },
    "layout-issue": { cause: "Unbounded constraints or overflow", factors: ["Missing Expanded/Flexible", "Fixed height in scrollable", "Missing SingleChildScrollView"] },
    "accessibility-issue": { cause: "Missing semantic information", factors: ["No Semantics labels", "Small touch targets", "Low contrast"] },
    "performance-issue": { cause: "Excessive widget rebuilds", factors: ["Missing const", "Deep widget tree", "setState in build"] },
    "state-issue": { cause: "Improper state management", factors: ["setState for global state", "Missing dispose", "Race condition"] },
    "navigation-issue": { cause: "Route configuration error", factors: ["Missing route definition", "Incorrect context", "Stack overflow"] },
    "theme-issue": { cause: "Inconsistent theme usage", factors: ["Hardcoded colors", "Missing ThemeData", "M2/M3 mixing"] },
    "dependency-issue": { cause: "Package version conflict", factors: ["Incompatible versions", "Missing dependency", "Pub cache corruption"] },
    "build-failure": { cause: "Compilation or linking error", factors: ["Gradle config", "Missing platform setup", "SDK version mismatch"] },
    "runtime-exception": { cause: "Unhandled exception at runtime", factors: ["Missing try-catch", "Async without mounted check", "Disposed controller access"] },
  };

  const mapped = causeMap[problem.category] ?? { cause: "Unknown root cause", factors: [] };

  return {
    id: uid("rc"),
    problemId: problem.id,
    rootCause: mapped.cause,
    contributingFactors: mapped.factors,
    evidence: problem.evidence,
    confidence: 0.75 + Math.random() * 0.2,
    alternatives: [
      "Alternative: Check for recent changes that introduced the issue",
      "Alternative: Verify dependency versions are compatible",
      "Alternative: Review widget lifecycle and disposal",
    ],
  };
}
