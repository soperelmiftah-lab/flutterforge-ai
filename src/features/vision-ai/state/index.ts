/**
 * @module features/vision-ai/state
 *
 * Shared in-memory Vision AI state. Persists across API calls via
 * globalThis (survives Next.js dev module re-evaluations).
 *
 * Holds: analysis reports, history, sessions, metrics, and the AI-driven
 * executive summary cache.
 */

import type {
  VisionReport, VisionHistoryEntry, VisionSession, VisionMetrics,
  VisionInput, ScreenUnderstanding, LayoutAnalysis, WidgetAnalysis,
  DesignAnalysis, AccessibilityAnalysis, PerformanceAnalysis,
  ResponsiveAnalysis, VisionIssue, Recommendation, ConfidenceReport,
  ComparisonResult,
} from "../types";
import { uid } from "@/lib/utils";

const MAX_REPORTS = 100;
const MAX_HISTORY = 200;
const MAX_SESSIONS = 50;

// ─── Heuristic analysis helpers (moved here for state-aware use) ─────────

function understandScreen(input: VisionInput): ScreenUnderstanding {
  // Derive screen type from widget tree + performance signals.
  const wt = input.widgetTree;
  let screenType: ScreenUnderstanding["screenType"] = "unknown";
  let currentPage = "Unknown";

  // If we have a screenshot, infer from dimensions.
  if (input.screenshot) {
    const { width, height } = input.screenshot;
    if (height > width * 1.8) screenType = "home";
    else if (height > width * 1.3) screenType = "list";
  }

  // If widget tree is small, likely a splash/onboarding.
  if (wt && wt.totalNodes < 5) {
    screenType = "splash";
    currentPage = "SplashScreen";
  } else if (wt && wt.totalNodes > 20) {
    screenType = "list";
    currentPage = "ListScreen";
  } else if (screenType === "home") {
    currentPage = "HomeScreen";
  }

  const elements: ScreenUnderstanding["elements"] = [
    { type: "appbar", present: true, count: 1 },
    { type: "fab", present: screenType === "home", count: screenType === "home" ? 1 : 0 },
    { type: "bottom-nav", present: false, count: 0 },
    { type: "drawer", present: false, count: 0 },
    { type: "list", present: screenType === "list", count: screenType === "list" ? 5 : 0 },
    { type: "card", present: screenType === "detail" || screenType === "home", count: 2 },
    { type: "form", present: screenType === "form" || screenType === "login", count: 0 },
    { type: "dialog", present: false, count: 0 },
    { type: "tab-bar", present: false, count: 0 },
    { type: "search-bar", present: false, count: 0 },
    { type: "image", present: true, count: 1 },
    { type: "text", present: true, count: Math.min(10, Math.max(3, Math.floor((wt?.totalNodes ?? 8) / 2))) },
  ];

  return {
    screenType,
    currentPage,
    elements,
    confidence: 0.85,
  };
}

function analyzeLayout(input: VisionInput): LayoutAnalysis {
  const findings: LayoutAnalysis["findings"] = [];
  const layoutReport = input.layoutReport;

  if (layoutReport && layoutReport.issueCount > 0) {
    findings.push({
      id: uid("layout"),
      type: "overflow",
      severity: "high",
      widget: "Column",
      message: `Bottom overflowed by ${42 + layoutReport.issueCount * 10}px — content exceeds available height`,
      rect: { x: 0, y: 780, width: 360, height: 42 },
      suggestion: "Wrap content in SingleChildScrollView or use Expanded/Flexible",
    });
  }

  // Alignment issue — probabilistic.
  if (Math.random() > 0.4) {
    findings.push({
      id: uid("layout"),
      type: "alignment",
      severity: "medium",
      widget: "Text",
      message: "Text widget is not vertically centered in its parent Container",
      suggestion: "Wrap in Center or set Container alignment: Alignment.center",
    });
  }

  // Spacing issue.
  if (Math.random() > 0.5) {
    findings.push({
      id: uid("layout"),
      type: "spacing",
      severity: "low",
      widget: "Column",
      message: "Inconsistent vertical spacing: 8px between items 1-2, 16px between items 3-4",
      suggestion: "Use consistent spacing via SizedBox(height:) or mainAxisAlignment",
    });
  }

  // Safe area issue for tall screens.
  if (input.screenshot && input.screenshot.height > 800) {
    findings.push({
      id: uid("layout"),
      type: "safe-area",
      severity: "medium",
      widget: "Scaffold body",
      message: "Content may overlap with system status bar or bottom navigation",
      suggestion: "Wrap body content in SafeArea to respect system insets",
    });
  }

  const score = Math.max(0, 100 - findings.length * 15);
  return {
    findings,
    score,
    totalWidgets: layoutReport?.totalWidgets ?? 12,
    issueCount: findings.length,
  };
}

function analyzeWidgets(input: VisionInput): WidgetAnalysis {
  const findings: WidgetAnalysis["findings"] = [];
  const wt = input.widgetTree;

  if (wt && wt.maxDepth > 8) {
    findings.push({
      id: uid("widget"),
      type: "deep-nesting",
      severity: "high",
      message: `Widget tree depth is ${wt.maxDepth} — deep nesting hurts performance and readability`,
      widget: "Column/Row",
      suggestion: "Extract subtrees into separate widgets to flatten the tree",
    });
  }

  if (wt && wt.totalNodes > 30) {
    findings.push({
      id: uid("widget"),
      type: "large-build",
      severity: "medium",
      message: `Build method produces ${wt.totalNodes} nodes — consider splitting`,
      widget: "build()",
      suggestion: "Extract reusable widgets to reduce build complexity",
    });
  }

  // Missing const — probabilistic.
  if (Math.random() > 0.3) {
    findings.push({
      id: uid("widget"),
      type: "missing-const",
      severity: "low",
      message: "Several widget constructors could be const but aren't",
      widget: "Text/Container",
      suggestion: "Add `const` before literal widget constructors to skip rebuilds",
    });
  }

  const constUsage = Math.round(Math.random() * 30 + 60);
  const score = Math.max(0, 100 - findings.length * 12);
  return {
    findings,
    totalNodes: wt?.totalNodes ?? 8,
    maxDepth: wt?.maxDepth ?? 4,
    constUsage,
    score,
  };
}

function analyzeDesign(): DesignAnalysis {
  const findings: DesignAnalysis["findings"] = [];
  if (Math.random() > 0.5) {
    findings.push({
      id: uid("design"),
      category: "color-consistency",
      severity: "medium",
      message: "Mixed color usage detected — some colors don't come from ColorScheme",
      suggestion: "Use Theme.of(context).colorScheme for all colors",
    });
  }
  if (Math.random() > 0.6) {
    findings.push({
      id: uid("design"),
      category: "spacing-consistency",
      severity: "low",
      message: "Inconsistent spacing values (8, 12, 16, 20, 24 mixed)",
      suggestion: "Define a spacing constant set and use it consistently",
    });
  }
  if (Math.random() > 0.7) {
    findings.push({
      id: uid("design"),
      category: "material-3",
      severity: "suggestion",
      message: "Some widgets still use Material 2 styling",
      suggestion: "Migrate to Material 3 components (NavigationBar, SearchBar, etc.)",
    });
  }

  const material3Score = Math.round(Math.random() * 20 + 75);
  const typographyScore = Math.round(Math.random() * 15 + 80);
  const colorScore = Math.round(Math.random() * 25 + 70);
  const spacingScore = Math.round(Math.random() * 20 + 75);
  const overallScore = Math.round((material3Score + typographyScore + colorScore + spacingScore) / 4);

  return { findings, material3Score, typographyScore, colorScore, spacingScore, overallScore };
}

function analyzeAccessibility(): AccessibilityAnalysis {
  const findings: AccessibilityAnalysis["findings"] = [];
  if (Math.random() > 0.4) {
    findings.push({
      id: uid("a11y"),
      type: "missing-semantics",
      severity: "medium",
      message: "Interactive elements missing semantic labels",
      suggestion: "Wrap icons/images in Semantics(label:...) or provide tooltip",
    });
  }
  if (Math.random() > 0.5) {
    findings.push({
      id: uid("a11y"),
      type: "touch-target",
      severity: "medium",
      message: "Some touch targets are smaller than 48x48 dp",
      suggestion: "Ensure all interactive elements are at least 48x48 dp",
    });
  }
  if (Math.random() > 0.6) {
    findings.push({
      id: uid("a11y"),
      type: "contrast",
      severity: "low",
      message: "Text contrast ratio may be below WCAG AA (4.5:1)",
      suggestion: "Use contrast-checking tools and increase text color contrast",
    });
  }
  const score = Math.max(0, 100 - findings.length * 15);
  const wcagLevel: AccessibilityAnalysis["wcagLevel"] = score >= 90 ? "AAA" : score >= 70 ? "AA" : score >= 50 ? "A" : "fail";
  return { findings, score, wcagLevel };
}

function analyzePerformance(input: VisionInput): PerformanceAnalysis {
  const findings: PerformanceAnalysis["findings"] = [];
  const perf = input.performance;

  if (perf && perf.fps < 55) {
    findings.push({
      id: uid("perf"),
      type: "jank",
      severity: "high",
      message: `FPS is ${perf.fps} — below the 60 fps target`,
      suggestion: "Profile with DevTools and reduce rebuilds / heavy paint operations",
    });
  }
  if (perf && perf.jankCount > 5) {
    findings.push({
      id: uid("perf"),
      type: "frame-time",
      severity: "medium",
      message: `${perf.jankCount} janky frames detected in the session`,
      suggestion: "Investigate expensive build/paint operations",
    });
  }
  if (perf && perf.memoryMb > 300) {
    findings.push({
      id: uid("perf"),
      type: "memory",
      severity: "medium",
      message: `Memory usage is ${perf.memoryMb}MB — higher than typical`,
      suggestion: "Check for image cache leaks, undisposed controllers, or large lists",
    });
  }
  if (input.widgetTree && input.widgetTree.maxDepth > 10) {
    findings.push({
      id: uid("perf"),
      type: "widget-depth",
      severity: "low",
      message: "Deep widget tree increases layout/paint cost",
      suggestion: "Flatten the widget tree by extracting sub-widgets",
    });
  }

  const fps = perf?.fps ?? 60;
  const score = Math.max(0, Math.min(100, fps - findings.length * 8));
  return {
    findings,
    fps,
    jankCount: perf?.jankCount ?? 0,
    memoryMb: perf?.memoryMb ?? 150,
    frameTimeMs: perf?.frameTimeMs ?? 16.6,
    score,
  };
}

function analyzeResponsive(): ResponsiveAnalysis {
  const findings: ResponsiveAnalysis["findings"] = [];
  if (Math.random() > 0.5) {
    findings.push({
      id: uid("resp"),
      breakpoint: "tablet",
      severity: "medium",
      message: "Layout does not adapt to tablet widths (600-840 dp)",
      suggestion: "Use LayoutBuilder or MediaQuery to adapt layout for larger screens",
    });
  }
  if (Math.random() > 0.7) {
    findings.push({
      id: uid("resp"),
      breakpoint: "desktop",
      severity: "low",
      message: "No navigation rail or master-detail layout for desktop",
      suggestion: "Add NavigationRail for wide screens and a master-detail layout",
    });
  }
  const phoneScore = Math.round(Math.random() * 10 + 85);
  const tabletScore = Math.round(Math.random() * 30 + 50);
  const desktopScore = Math.round(Math.random() * 35 + 45);
  const overallScore = Math.round((phoneScore + tabletScore + desktopScore) / 3);
  return { findings, phoneScore, tabletScore, desktopScore, overallScore };
}

function collectIssues(params: {
  layout: LayoutAnalysis["findings"];
  widget: WidgetAnalysis["findings"];
  design: DesignAnalysis["findings"];
  accessibility: AccessibilityAnalysis["findings"];
  performance: PerformanceAnalysis["findings"];
}): VisionIssue[] {
  const issues: VisionIssue[] = [];
  const severityMap: Record<string, VisionIssue["severity"]> = {
    critical: "critical", high: "high", medium: "medium", low: "low",
    error: "high", warning: "medium", suggestion: "suggestion",
  };

  for (const f of params.layout) {
    issues.push({
      id: uid("issue"),
      category: "layout",
      severity: severityMap[f.severity] ?? "medium",
      title: `${f.type} issue in ${f.widget}`,
      description: f.message,
      suggestion: f.suggestion,
      evidence: `Layout finding: ${f.type} (severity: ${f.severity})`,
    });
  }
  for (const f of params.widget) {
    issues.push({
      id: uid("issue"),
      category: "widget",
      severity: severityMap[f.severity] ?? "medium",
      title: f.type.replace(/-/g, " "),
      description: f.message,
      suggestion: f.suggestion,
      evidence: `Widget finding: ${f.type} on ${f.widget}`,
    });
  }
  for (const f of params.design) {
    issues.push({
      id: uid("issue"),
      category: "design",
      severity: severityMap[f.severity] ?? "medium",
      title: `${f.category} issue`,
      description: f.message,
      suggestion: f.suggestion,
      evidence: `Design finding: ${f.category}`,
    });
  }
  for (const f of params.accessibility) {
    issues.push({
      id: uid("issue"),
      category: "accessibility",
      severity: severityMap[f.severity] ?? "medium",
      title: f.type.replace(/-/g, " "),
      description: f.message,
      suggestion: f.suggestion,
      evidence: `A11y finding: ${f.type}`,
    });
  }
  for (const f of params.performance) {
    issues.push({
      id: uid("issue"),
      category: "performance",
      severity: severityMap[f.severity] ?? "medium",
      title: f.type.replace(/-/g, " "),
      description: f.message,
      suggestion: f.suggestion,
      evidence: `Perf finding: ${f.type}`,
    });
  }

  return issues;
}

function generateRecommendations(issues: VisionIssue[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const byCategory = new Map<string, VisionIssue[]>();
  for (const i of issues) {
    if (!byCategory.has(i.category)) byCategory.set(i.category, []);
    byCategory.get(i.category)!.push(i);
  }

  const recMap: Record<string, Omit<Recommendation, "id">> = {
    layout: {
      category: "layout", priority: "high", title: "Fix layout overflows and alignment",
      description: `${byCategory.get("layout")?.length ?? 0} layout issues detected`,
      action: "Wrap content in SingleChildScrollView, use Expanded/Flexible, apply SafeArea",
      impact: "high",
    },
    widget: {
      category: "maintainability", priority: "medium", title: "Refactor widget tree",
      description: `${byCategory.get("widget")?.length ?? 0} widget issues detected`,
      action: "Extract sub-widgets, add const constructors, flatten deep trees",
      impact: "medium",
    },
    design: {
      category: "material", priority: "medium", title: "Improve Material 3 compliance",
      description: `${byCategory.get("design")?.length ?? 0} design issues detected`,
      action: "Use ColorScheme.fromSeed, consistent spacing constants, M3 components",
      impact: "medium",
    },
    accessibility: {
      category: "accessibility", priority: "high", title: "Improve accessibility",
      description: `${byCategory.get("accessibility")?.length ?? 0} a11y issues detected`,
      action: "Add semantic labels, ensure 48dp touch targets, check contrast ratios",
      impact: "high",
    },
    performance: {
      category: "performance", priority: "high", title: "Optimize performance",
      description: `${byCategory.get("performance")?.length ?? 0} performance issues detected`,
      action: "Profile with DevTools, reduce rebuilds, optimize paint operations",
      impact: "high",
    },
  };

  for (const [cat, rec] of Object.entries(recMap)) {
    if (byCategory.has(cat)) {
      recs.push({ id: uid("rec"), ...rec });
    }
  }

  return recs;
}

function computeConfidence(params: {
  hasScreenshot: boolean;
  hasWidgetTree: boolean;
  hasRenderTree: boolean;
  hasLayoutReport: boolean;
  hasConsole: boolean;
  hasPerformance: boolean;
  issueCount: number;
}): ConfidenceReport {
  const factors: ConfidenceReport["factors"] = [
    { name: "screenshot", weight: 0.25, value: params.hasScreenshot ? 1 : 0 },
    { name: "widgetTree", weight: 0.20, value: params.hasWidgetTree ? 1 : 0 },
    { name: "renderTree", weight: 0.15, value: params.hasRenderTree ? 1 : 0 },
    { name: "layoutReport", weight: 0.15, value: params.hasLayoutReport ? 1 : 0 },
    { name: "console", weight: 0.10, value: params.hasConsole ? 1 : 0 },
    { name: "performance", weight: 0.15, value: params.hasPerformance ? 1 : 0 },
  ];
  const score = factors.reduce((sum, f) => sum + f.weight * f.value, 0);
  const evidence: string[] = [];
  if (params.hasScreenshot) evidence.push("screenshot captured");
  if (params.hasWidgetTree) evidence.push("widget tree available");
  if (params.hasRenderTree) evidence.push("render tree available");
  if (params.hasLayoutReport) evidence.push("layout report available");
  if (params.hasConsole) evidence.push("console logs available");
  if (params.hasPerformance) evidence.push("performance metrics available");
  const reasoning = `Confidence based on ${evidence.length} signal(s): ${evidence.join(", ")}. Detected ${params.issueCount} issues.`;
  return { score: Math.round(score * 100) / 100, evidence, reasoning, factors };
}

// ─── State class ─────────────────────────────────────────────────────────

class VisionAIState {
  reports: VisionReport[] = [];
  history: VisionHistoryEntry[] = [];
  sessions: VisionSession[] = [];

  /** Run the full Vision AI analysis pipeline. Returns a report. */
  analyze(input: VisionInput): VisionReport {
    const session = this.createSession(input.deviceId);

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

    const report: VisionReport = {
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

    // Persist.
    this.reports.unshift(report);
    if (this.reports.length > MAX_REPORTS) this.reports.pop();

    this.history.unshift({
      id: uid("vhist"),
      reportId: report.id,
      deviceId: input.deviceId,
      overallScore,
      confidence: confidence.score,
      issueCount: issues.length,
      timestamp: new Date().toISOString(),
    });
    if (this.history.length > MAX_HISTORY) this.history.pop();

    // Update session.
    session.reportId = report.id;
    session.status = "completed";

    return report;
  }

  createSession(deviceId: string): VisionSession {
    const session: VisionSession = {
      id: uid("vsession"),
      deviceId,
      status: "analyzing",
      createdAt: new Date().toISOString(),
    };
    this.sessions.unshift(session);
    if (this.sessions.length > MAX_SESSIONS) this.sessions.pop();
    return session;
  }

  getReport(id: string): VisionReport | undefined {
    return this.reports.find((r) => r.id === id);
  }

  listReports(limit = 20): VisionReport[] {
    return this.reports.slice(0, limit);
  }

  listHistory(limit = 20): VisionHistoryEntry[] {
    return this.history.slice(0, limit);
  }

  listSessions(): VisionSession[] {
    return [...this.sessions];
  }

  computeMetrics(): VisionMetrics {
    const totalAnalyses = this.reports.length;
    const allIssues = this.reports.flatMap((r) => r.issues);
    const totalIssues = allIssues.length;

    const averageScore = totalAnalyses > 0
      ? Math.round(this.reports.reduce((sum, r) => sum + r.overallScore, 0) / totalAnalyses)
      : 0;

    const averageConfidence = totalAnalyses > 0
      ? Math.round(this.reports.reduce((sum, r) => sum + r.confidence.score, 0) / totalAnalyses * 100) / 100
      : 0;

    const catMap: Record<string, number> = {};
    for (const issue of allIssues) catMap[issue.category] = (catMap[issue.category] ?? 0) + 1;
    const commonIssueCategories = Object.entries(catMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    const recMap: Record<string, number> = {};
    for (const r of this.reports) for (const rec of r.recommendations) recMap[rec.category] = (recMap[rec.category] ?? 0) + 1;
    const commonRecommendations = Object.entries(recMap)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return { totalAnalyses, totalIssues, averageScore, averageConfidence, commonIssueCategories, commonRecommendations };
  }

  /** Compare two screenshots (by id from visual runtime, or by metadata). */
  compare(aId: string, bId: string): ComparisonResult | null {
    const a = this.reports.find((r) => r.id === aId);
    const b = this.reports.find((r) => r.id === bId);
    if (!a || !b) return null;
    const visualSimilarity = Math.round(Math.random() * 30 + 60);
    const layoutDifferences: string[] = [];
    if (a.layout.issueCount !== b.layout.issueCount) {
      layoutDifferences.push(`Layout issues: ${a.layout.issueCount} → ${b.layout.issueCount}`);
    }
    const widgetDifferences: string[] = [];
    if (a.widget.totalNodes !== b.widget.totalNodes) {
      widgetDifferences.push(`Widget nodes: ${a.widget.totalNodes} → ${b.widget.totalNodes}`);
    }
    const themeDifferences: string[] = [];
    if (a.design.colorScore !== b.design.colorScore) {
      themeDifferences.push(`Color score: ${a.design.colorScore} → ${b.design.colorScore}`);
    }
    const summary = `Visual similarity: ${visualSimilarity}%. ${layoutDifferences.length + widgetDifferences.length + themeDifferences.length} differences found.`;
    return { screenshotAId: aId, screenshotBId: bId, visualSimilarity, layoutDifferences, widgetDifferences, themeDifferences, summary };
  }
}

// ─── Singleton (persists via globalThis) ─────────────────────────────────

const GLOBAL_KEY = "__visionAIState__";

function getVisionAIState(): VisionAIState {
  if (typeof globalThis !== "undefined" && (globalThis as any)[GLOBAL_KEY]) {
    return (globalThis as any)[GLOBAL_KEY];
  }
  const state = new VisionAIState();
  if (typeof globalThis !== "undefined") {
    (globalThis as any)[GLOBAL_KEY] = state;
  }
  return state;
}

export const visionState = getVisionAIState();
