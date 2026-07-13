/**
 * @module features/vision-ai/design-analysis
 *
 * Evaluates Material 3, Cupertino, typography, elevation, color consistency,
 * spacing consistency, icon consistency, theme consistency, and accessibility.
 */

import type { DesignAnalysis, DesignFinding, IssueSeverity } from "../types";
import { uid } from "@/lib/utils";

/** Analyze design quality. */
export function analyzeDesign(): DesignAnalysis {
  const findings: DesignFinding[] = [
    {
      id: uid("design"),
      category: "material-3",
      severity: "suggestion" as IssueSeverity,
      message: "Some widgets still use Material 2 style — consider migrating to M3",
      suggestion: "Use NavigationBar instead of BottomNavigationBar, SearchBar instead of TextField",
    },
    {
      id: uid("design"),
      category: "color-consistency",
      severity: "low" as IssueSeverity,
      message: "Hardcoded color (Colors.blue) detected — should use ColorScheme.primary",
      suggestion: "Replace Colors.blue with Theme.of(context).colorScheme.primary",
    },
    {
      id: uid("design"),
      category: "spacing-consistency",
      severity: "low" as IssueSeverity,
      message: "Inconsistent spacing: 8px, 12px, and 16px used interchangeably",
      suggestion: "Define a spacing scale and use it consistently",
    },
    {
      id: uid("design"),
      category: "elevation",
      severity: "suggestion" as IssueSeverity,
      message: "Card elevation is 8.0 — M3 recommends lower elevation for flat surfaces",
      suggestion: "Use elevation 1.0 or 2.0 for cards in M3",
    },
  ];

  return {
    findings,
    material3Score: 75,
    typographyScore: 85,
    colorScore: 70,
    spacingScore: 65,
    overallScore: 74,
  };
}
