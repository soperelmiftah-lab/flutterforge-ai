/**
 * @module features/vision-ai/recommendations
 *
 * Recommendation Engine — generates layout, performance, accessibility,
 * material, best-practice, and maintainability recommendations.
 */

import type { Recommendation, VisionIssue } from "../types";
import { uid } from "@/lib/utils";

/** Generate recommendations from detected issues. */
export function generateRecommendations(issues: VisionIssue[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const seen = new Set<string>();

  for (const issue of issues) {
    const key = `${issue.category}:${issue.suggestion.slice(0, 30)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const category = mapCategory(issue.category);
    const priority = issue.severity === "critical" || issue.severity === "high" ? "high" : issue.severity === "medium" ? "medium" : "low";
    const impact = issue.severity === "critical" || issue.severity === "high" ? "high" : "medium";

    recs.push({
      id: uid("rec"),
      category,
      priority: priority as Recommendation["priority"],
      title: issue.title,
      description: issue.description,
      action: issue.suggestion,
      impact: impact as Recommendation["impact"],
    });
  }

  // Add general best-practice recommendations.
  recs.push({
    id: uid("rec"),
    category: "best-practice",
    priority: "medium",
    title: "Use const constructors",
    description: "Many widgets can be const but aren't marked as such",
    action: "Add const to widget constructors wherever possible to skip rebuilds",
    impact: "medium",
  });
  recs.push({
    id: uid("rec"),
    category: "material",
    priority: "low",
    title: "Migrate to Material 3",
    description: "Some components still use Material 2 patterns",
    action: "Use NavigationBar, SearchBar, and M3 color schemes",
    impact: "medium",
  });

  return recs;
}

function mapCategory(cat: string): Recommendation["category"] {
  const map: Record<string, Recommendation["category"]> = {
    layout: "layout",
    widget: "maintainability",
    design: "material",
    accessibility: "accessibility",
    performance: "performance",
    responsive: "layout",
  };
  return map[cat] ?? "best-practice";
}
