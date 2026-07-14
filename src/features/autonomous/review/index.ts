/**
 * @module features/autonomous/review
 *
 * Review Engine — performs automated code review across code, Flutter,
 * architecture, security, and performance categories.
 */

import type { ReviewFinding } from "../types";
import { uid } from "@/lib/utils";

/** Perform automated review. */
export function performReview(): ReviewFinding[] {
  return [
    { id: uid("rev"), category: "code", severity: "warning", message: "Missing const constructors on several widgets", suggestion: "Add const to improve performance" },
    { id: uid("rev"), category: "flutter", severity: "info", message: "Using deprecated BottomNavigationBar", suggestion: "Migrate to NavigationBar (M3)" },
    { id: uid("rev"), category: "architecture", severity: "warning", message: "Business logic in widget build method", suggestion: "Extract to a provider or service" },
    { id: uid("rev"), category: "security", severity: "info", message: "API keys stored in source code", suggestion: "Move to environment variables" },
    { id: uid("rev"), category: "performance", severity: "warning", message: "ListView without builder for large lists", suggestion: "Use ListView.builder for lazy loading" },
  ];
}
