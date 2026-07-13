/**
 * @module features/vision-ai/types
 *
 * Core domain types for the Vision AI & Autonomous UI Analysis Platform.
 */

// ─── Screen Understanding ───────────────────────────────────────────────

export type ScreenType =
  | "home" | "list" | "detail" | "form" | "dialog" | "settings"
  | "login" | "onboarding" | "splash" | "profile" | "search" | "unknown";

export interface ScreenElement {
  type: "appbar" | "bottom-nav" | "fab" | "drawer" | "list" | "card"
      | "form" | "dialog" | "tab-bar" | "search-bar" | "image" | "text";
  present: boolean;
  count: number;
}

export interface ScreenUnderstanding {
  screenType: ScreenType;
  currentPage: string;
  elements: ScreenElement[];
  confidence: number;
}

// ─── Layout Analysis ────────────────────────────────────────────────────

export type LayoutIssueType =
  | "overflow" | "alignment" | "spacing" | "padding" | "margin"
  | "unbalanced" | "nested-scroll" | "clipping" | "safe-area" | "responsive";

export interface LayoutFinding {
  id: string;
  type: LayoutIssueType;
  severity: IssueSeverity;
  widget: string;
  message: string;
  rect?: { x: number; y: number; width: number; height: number };
  suggestion: string;
}

export interface LayoutAnalysis {
  findings: LayoutFinding[];
  score: number;
  totalWidgets: number;
  issueCount: number;
}

// ─── Widget Analysis ────────────────────────────────────────────────────

export interface WidgetFinding {
  id: string;
  type: "deep-nesting" | "large-build" | "duplicate" | "missing-const"
      | "heavy-tree" | "complex-composition";
  severity: IssueSeverity;
  message: string;
  widget: string;
  suggestion: string;
}

export interface WidgetAnalysis {
  findings: WidgetFinding[];
  totalNodes: number;
  maxDepth: number;
  constUsage: number;
  score: number;
}

// ─── Design Analysis ────────────────────────────────────────────────────

export type DesignCategory =
  | "material-3" | "cupertino" | "typography" | "elevation" | "color-consistency"
  | "spacing-consistency" | "icon-consistency" | "theme-consistency" | "accessibility";

export interface DesignFinding {
  id: string;
  category: DesignCategory;
  severity: IssueSeverity;
  message: string;
  suggestion: string;
}

export interface DesignAnalysis {
  findings: DesignFinding[];
  material3Score: number;
  typographyScore: number;
  colorScore: number;
  spacingScore: number;
  overallScore: number;
}

// ─── Accessibility Analysis ─────────────────────────────────────────────

export interface AccessibilityFinding {
  id: string;
  type: "missing-semantics" | "touch-target" | "contrast" | "text-scaling"
      | "focus-order" | "missing-label";
  severity: IssueSeverity;
  message: string;
  suggestion: string;
}

export interface AccessibilityAnalysis {
  findings: AccessibilityFinding[];
  score: number;
  wcagLevel: "A" | "AA" | "AAA" | "fail";
}

// ─── Performance Analysis ───────────────────────────────────────────────

export interface PerformanceFinding {
  id: string;
  type: "rebuild-frequency" | "widget-depth" | "render-complexity"
      | "jank" | "memory" | "frame-time";
  severity: IssueSeverity;
  message: string;
  suggestion: string;
}

export interface PerformanceAnalysis {
  findings: PerformanceFinding[];
  fps: number;
  jankCount: number;
  memoryMb: number;
  frameTimeMs: number;
  score: number;
}

// ─── Responsive Analysis ────────────────────────────────────────────────

export interface ResponsiveFinding {
  id: string;
  breakpoint: "phone" | "tablet" | "desktop" | "foldable";
  severity: IssueSeverity;
  message: string;
  suggestion: string;
}

export interface ResponsiveAnalysis {
  findings: ResponsiveFinding[];
  phoneScore: number;
  tabletScore: number;
  desktopScore: number;
  overallScore: number;
}

// ─── Issues ─────────────────────────────────────────────────────────────

export type IssueSeverity = "critical" | "high" | "medium" | "low" | "suggestion";

export interface VisionIssue {
  id: string;
  category: "layout" | "widget" | "design" | "accessibility" | "performance" | "responsive";
  severity: IssueSeverity;
  title: string;
  description: string;
  suggestion: string;
  evidence: string;
}

// ─── Recommendations ────────────────────────────────────────────────────

export type RecommendationCategory =
  | "layout" | "performance" | "accessibility" | "material" | "best-practice" | "maintainability";

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  impact: "high" | "medium" | "low";
}

// ─── Confidence ─────────────────────────────────────────────────────────

export interface ConfidenceReport {
  score: number;
  evidence: string[];
  reasoning: string;
  factors: Array<{ name: string; weight: number; value: number }>;
}

// ─── Comparison ─────────────────────────────────────────────────────────

export interface ComparisonResult {
  screenshotAId: string;
  screenshotBId: string;
  visualSimilarity: number;
  layoutDifferences: string[];
  widgetDifferences: string[];
  themeDifferences: string[];
  summary: string;
}

// ─── Report ─────────────────────────────────────────────────────────────

export interface VisionReport {
  id: string;
  deviceId: string;
  executiveSummary: string;
  screenUnderstanding: ScreenUnderstanding;
  layout: LayoutAnalysis;
  widget: WidgetAnalysis;
  design: DesignAnalysis;
  accessibility: AccessibilityAnalysis;
  performance: PerformanceAnalysis;
  responsive: ResponsiveAnalysis;
  issues: VisionIssue[];
  recommendations: Recommendation[];
  confidence: ConfidenceReport;
  overallScore: number;
  createdAt: string;
}

// ─── Sessions & History ─────────────────────────────────────────────────

export interface VisionSession {
  id: string;
  deviceId: string;
  reportId?: string;
  status: "analyzing" | "completed" | "failed";
  createdAt: string;
}

export interface VisionHistoryEntry {
  id: string;
  reportId: string;
  deviceId: string;
  overallScore: number;
  confidence: number;
  issueCount: number;
  timestamp: string;
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface VisionMetrics {
  totalAnalyses: number;
  totalIssues: number;
  averageScore: number;
  averageConfidence: number;
  commonIssueCategories: Array<{ category: string; count: number }>;
  commonRecommendations: Array<{ category: string; count: number }>;
}

// ─── Vision Input ───────────────────────────────────────────────────────

export interface VisionInput {
  deviceId: string;
  screenshot?: { width: number; height: number; orientation: string };
  widgetTree?: { totalNodes: number; maxDepth: number };
  renderTree?: { totalNodes: number; totalLayoutTimeMs: number; totalPaintTimeMs: number };
  layoutReport?: { issueCount: number; totalWidgets: number };
  console?: { errorCount: number; warningCount: number };
  performance?: { fps: number; jankCount: number; memoryMb: number; frameTimeMs: number };
}
