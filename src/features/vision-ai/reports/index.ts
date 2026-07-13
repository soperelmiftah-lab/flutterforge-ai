/**
 * @module features/vision-ai/reports
 *
 * Report Engine — produces comprehensive analysis reports with executive summary,
 * detected issues, recommendations, performance, accessibility, design quality,
 * architecture quality, and overall score.
 */

import type { VisionReport, VisionInput, VisionIssue, Recommendation, ConfidenceReport } from "../types";
import { understandScreen } from "../screen-understanding";
import { analyzeLayout } from "../layout-analysis";
import { analyzeWidgets } from "../widget-analysis";
import { analyzeDesign } from "../design-analysis";
import { analyzeAccessibility, analyzePerformance, analyzeResponsive } from "../analysis";
import { collectIssues } from "../issues";
import { generateRecommendations } from "../recommendations";
import { computeConfidence } from "../confidence";
import { uid } from "@/lib/utils";

/** The central Vision Engine — analyzes all visual data and produces a report. */
export function analyze(input: VisionInput): VisionReport {
  const screen = understandScreen(input);
  const layout = analyzeLayout(input);
  const widget = analyzeWidgets(input);
  const design = analyzeDesign();
  const accessibility = analyzeAccessibility();
  const performance = analyzePerformance(input);
  const responsive = analyzeResponsive();

  const issues = collectIssues({
    layout: layout.findings,
    widget: widget.findings,
    design: design.findings,
    accessibility: accessibility.findings,
    performance: performance.findings,
  });

  const recommendations = generateRecommendations(issues);

  const confidence = computeConfidence({
    hasScreenshot: !!input.screenshot,
    hasWidgetTree: !!input.widgetTree,
    hasRenderTree: !!input.renderTree,
    hasLayoutReport: !!input.layoutReport,
    hasConsole: !!input.console,
    hasPerformance: !!input.performance,
    issueCount: issues.length,
  });

  const overallScore = Math.round(
    (layout.score + widget.score + design.overallScore + accessibility.score + performance.score + responsive.overallScore) / 6
  );

  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const executiveSummary = `Analysis of ${screen.currentPage} (${screen.screenType} screen) found ${issues.length} issues (${criticalCount} critical, ${highCount} high). Overall score: ${overallScore}/100. Confidence: ${(confidence.score * 100).toFixed(0)}%.`;

  return {
    id: uid("report"),
    deviceId: input.deviceId,
    executiveSummary,
    screenUnderstanding: screen,
    layout,
    widget,
    design,
    accessibility,
    performance,
    responsive,
    issues,
    recommendations,
    confidence,
    overallScore,
    createdAt: new Date().toISOString(),
  };
}
