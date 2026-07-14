/**
 * @module features/autonomous/repair
 *
 * Repair Engine — supports all problem categories with repair strategies.
 */

import type { ProblemCategory } from "../types";

/** Repair strategy per problem category. */
export const repairStrategies: Record<ProblemCategory, { strategy: string; description: string; tools: string[] }> = {
  "flutter-error": { strategy: "Widget Fix", description: "Fix widget composition, properties, or lifecycle", tools: ["fs.read_file", "fs.write_file"] },
  "dart-error": { strategy: "Dart Fix", description: "Fix type errors, null safety, or syntax", tools: ["fs.read_file", "fs.write_file"] },
  "analysis-error": { strategy: "Lint Fix", description: "Fix analyzer rule violations", tools: ["fs.read_file", "fs.write_file", "flutter.analyze"] },
  "layout-issue": { strategy: "Layout Fix", description: "Fix overflow, constraints, or alignment", tools: ["fs.read_file", "fs.write_file"] },
  "accessibility-issue": { strategy: "A11y Fix", description: "Add semantics, fix contrast or touch targets", tools: ["fs.read_file", "fs.write_file"] },
  "performance-issue": { strategy: "Perf Fix", description: "Add const, extract widgets, optimize rebuilds", tools: ["fs.read_file", "fs.write_file", "flutter.analyze"] },
  "state-issue": { strategy: "State Fix", description: "Fix state management, disposal, or lifecycle", tools: ["fs.read_file", "fs.write_file"] },
  "navigation-issue": { strategy: "Nav Fix", description: "Fix routing, deep links, or navigation stack", tools: ["fs.read_file", "fs.write_file"] },
  "theme-issue": { strategy: "Theme Fix", description: "Fix color scheme, typography, or M3 compliance", tools: ["fs.read_file", "fs.write_file"] },
  "dependency-issue": { strategy: "Dep Fix", description: "Fix version conflicts, add missing deps", tools: ["fs.read_file", "fs.write_file", "flutter.pub_get"] },
  "build-failure": { strategy: "Build Fix", description: "Fix Gradle, SDK, or platform configuration", tools: ["fs.read_file", "fs.write_file", "flutter.clean"] },
  "runtime-exception": { strategy: "Runtime Fix", description: "Add try-catch, mounted checks, or dispose guards", tools: ["fs.read_file", "fs.write_file"] },
};

/** Get the repair strategy for a problem category. */
export function getStrategy(category: ProblemCategory) {
  return repairStrategies[category] ?? repairStrategies["flutter-error"];
}
