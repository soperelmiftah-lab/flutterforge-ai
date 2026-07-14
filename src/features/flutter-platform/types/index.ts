/** Flutter Platform types */
export type WidgetCategory = "layout" | "visual" | "input" | "navigation" | "dialog" | "scroll" | "animation" | "material" | "cupertino" | "foundation";
export interface WidgetCatalogEntry { id: string; name: string; category: WidgetCategory; description: string; properties: WidgetProperty[]; constructorSignature: string; example: string; bestPractices: string[]; commonMistakes: string[]; performanceNotes: string[]; import: string; sdk: "flutter" | "material" | "cupertino"; }
export interface WidgetProperty { name: string; type: string; required: boolean; defaultValue?: string; description: string; }
export interface WidgetNode { id: string; type: string; category: WidgetCategory; properties: Record<string, unknown>; children: WidgetNode[]; canBeConst: boolean; rebuildCost: number; }
export interface WidgetTree { id: string; root: WidgetNode; nodeCount: number; maxDepth: number; validated: boolean; optimized: boolean; warnings: string[]; generatedDart?: string; }
export interface FlutterPackage { name: string; version: string; description: string; category: "state" | "network" | "ui" | "routing" | "storage" | "testing" | "tooling" | "other"; isDependency: boolean; isDevDependency: boolean; homepage?: string; compatible: boolean; }
export interface FlutterTemplate { id: string; name: string; description: string; category: string; icon: string; screens: string[]; widgets: string[]; stateManagement: string; routing: string; estimatedComplexity: "simple" | "moderate" | "complex"; generatesDart: boolean; }
export type ReviewSeverity = "info" | "warning" | "error" | "critical";
export interface ReviewFinding { id: string; severity: ReviewSeverity; category: string; title: string; description: string; recommendation: string; file?: string; line?: number; }
export interface ReviewResult { findings: ReviewFinding[]; overallScore: number; architectureScore: number; performanceScore: number; accessibilityScore: number; maintainabilityScore: number; summary: string; }
export type RepairType = "broken-widget" | "invalid-build-context" | "memory-leak" | "async-misuse" | "setstate-misuse" | "disposed-controller" | "navigator-issue" | "theme-issue";
export interface RepairIssue { id: string; type: RepairType; severity: ReviewSeverity; title: string; description: string; fix: string; autoFixable: boolean; }
export interface RepairResult { issues: RepairIssue[]; autoFixableCount: number; criticalCount: number; summary: string; }
export interface BuildReadinessCheck { id: string; label: string; status: "pass" | "warning" | "fail"; message: string; }
export interface BuildReadiness { checks: BuildReadinessCheck[]; ready: boolean; score: number; blockers: string[]; }
export interface PerformanceIssue { id: string; category: string; severity: ReviewSeverity; title: string; description: string; suggestion: string; impact: "low" | "medium" | "high"; }
export interface PerformanceReport { issues: PerformanceIssue[]; rebuildScore: number; constUsageScore: number; memoryScore: number; overallScore: number; suggestions: string[]; }
