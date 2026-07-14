/**
 * @module features/vision-ai/metrics
 *
 * Metrics — tracks analyses, issues, average score, average confidence,
 * common issue categories, and common recommendations.
 */

import type { VisionMetrics, VisionReport } from "../types";

const reports: VisionReport[] = [];

export function recordReport(report: VisionReport): void {
  reports.unshift(report);
  if (reports.length > 100) reports.pop();
}

export function getReports(limit = 20): VisionReport[] {
  return reports.slice(0, limit);
}

export function getReport(id: string): VisionReport | undefined {
  return reports.find((r) => r.id === id);
}

export function computeMetrics(): VisionMetrics {
  const totalAnalyses = reports.length;
  const allIssues = reports.flatMap((r) => r.issues);
  const totalIssues = allIssues.length;

  const averageScore = totalAnalyses > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.overallScore, 0) / totalAnalyses)
    : 0;

  const averageConfidence = totalAnalyses > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.confidence.score, 0) / totalAnalyses * 100) / 100
    : 0;

  const catMap: Record<string, number> = {};
  for (const issue of allIssues) catMap[issue.category] = (catMap[issue.category] ?? 0) + 1;
  const commonIssueCategories = Object.entries(catMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  const recMap: Record<string, number> = {};
  for (const r of reports) for (const rec of r.recommendations) recMap[rec.category] = (recMap[rec.category] ?? 0) + 1;
  const commonRecommendations = Object.entries(recMap)
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return { totalAnalyses, totalIssues, averageScore, averageConfidence, commonIssueCategories, commonRecommendations };
}
