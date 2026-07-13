/**
 * @module features/autonomous/types
 *
 * Core domain types for the Autonomous Engineering System.
 */

// ─── Problem & Analysis ─────────────────────────────────────────────────

export type ProblemCategory =
  | "flutter-error" | "dart-error" | "analysis-error" | "layout-issue"
  | "accessibility-issue" | "performance-issue" | "state-issue"
  | "navigation-issue" | "theme-issue" | "dependency-issue" | "build-failure" | "runtime-exception";

export interface Problem {
  id: string;
  category: ProblemCategory;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  source: "analyzer" | "runtime" | "vision-ai" | "console" | "build" | "user";
  file?: string;
  line?: number;
  evidence: string[];
}

// ─── Root Cause ─────────────────────────────────────────────────────────

export interface RootCause {
  id: string;
  problemId: string;
  rootCause: string;
  contributingFactors: string[];
  evidence: string[];
  confidence: number;
  alternatives: string[];
}

// ─── Patch Planning ─────────────────────────────────────────────────────

export interface PatchCandidate {
  id: string;
  title: string;
  description: string;
  affectedFiles: string[];
  riskLevel: "safe" | "moderate" | "high" | "critical";
  expectedOutcome: string;
  sideEffects: string[];
  failureProbability: number;
  estimatedComplexity: "trivial" | "simple" | "moderate" | "complex";
}

export interface RepairPlan {
  id: string;
  problemId: string;
  rootCauseId: string;
  candidates: PatchCandidate[];
  selectedCandidateId?: string;
  rationale: string;
}

// ─── Simulation ─────────────────────────────────────────────────────────

export interface SimulationResult {
  patchId: string;
  dryRun: true;
  expectedOutcome: string;
  sideEffects: string[];
  failureProbability: number;
  successProbability: number;
  warnings: string[];
  simulatedAt: string;
}

// ─── Validation ─────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  checks: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
  score: number;
}

// ─── Verification ───────────────────────────────────────────────────────

export interface VerificationResult {
  issueResolved: boolean;
  regressions: string[];
  performanceMaintained: boolean;
  beforeScore: number;
  afterScore: number;
  summary: string;
}

// ─── Regression ─────────────────────────────────────────────────────────

export interface RegressionIssue {
  id: string;
  type: "new-issue" | "broken-layout" | "new-warning" | "new-error" | "nav-failure";
  description: string;
  severity: "critical" | "high" | "medium" | "low";
}

export interface RegressionReport {
  issues: RegressionIssue[];
  hasRegressions: boolean;
  count: number;
}

// ─── Quality ────────────────────────────────────────────────────────────

export interface QualityScore {
  overall: number;
  maintainability: number;
  complexity: number;
  performance: number;
  accessibility: number;
  architecture: number;
}

// ─── Review ─────────────────────────────────────────────────────────────

export interface ReviewFinding {
  id: string;
  category: "code" | "flutter" | "architecture" | "security" | "performance";
  severity: "info" | "warning" | "error";
  message: string;
  suggestion: string;
}

// ─── Decision ───────────────────────────────────────────────────────────

export type DecisionAction = "reject" | "approve" | "request-approval" | "generate-alternatives" | "retry-planning";

export interface Decision {
  action: DecisionAction;
  reason: string;
  confidence: number;
  riskLevel: "safe" | "moderate" | "high" | "critical";
}

// ─── Confidence ─────────────────────────────────────────────────────────

export interface ConfidenceReport {
  repairConfidence: number;
  riskLevel: "safe" | "moderate" | "high" | "critical";
  expectedSuccess: number;
  factors: Array<{ name: string; weight: number; value: number }>;
  reasoning: string;
}

// ─── Engineering Pipeline ───────────────────────────────────────────────

export type PipelineStage =
  | "problem" | "analysis" | "root-cause" | "repair-plan" | "simulation"
  | "validation" | "approval" | "execution" | "verification" | "learning";

export interface PipelineStep {
  stage: PipelineStage;
  status: "pending" | "active" | "completed" | "failed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
}

export interface EngineeringPipeline {
  id: string;
  problemId: string;
  steps: PipelineStep[];
  currentStage: PipelineStage;
  status: "active" | "completed" | "failed";
  createdAt: string;
}

// ─── Sessions & History ─────────────────────────────────────────────────

export interface AutonomousSession {
  id: string;
  problemId: string;
  pipelineId: string;
  status: "active" | "completed" | "failed" | "rolled-back";
  createdAt: string;
  completedAt?: string;
}

export interface HistoryEntry {
  id: string;
  problemTitle: string;
  category: ProblemCategory;
  success: boolean;
  durationMs: number;
  confidence: number;
  rolledBack: boolean;
  timestamp: string;
}

// ─── Learning ───────────────────────────────────────────────────────────

export interface LearningRecord {
  id: string;
  problemCategory: ProblemCategory;
  repairStrategy: string;
  success: boolean;
  confidence: number;
  durationMs: number;
  learnedAt: string;
}

export interface LearningSummary {
  totalRepairs: number;
  successRate: number;
  commonStrategies: Array<{ strategy: string; count: number; successRate: number }>;
  commonIssues: Array<{ category: ProblemCategory; count: number }>;
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface AutonomousMetrics {
  totalProblems: number;
  totalRepairs: number;
  successRate: number;
  averageConfidence: number;
  rollbackCount: number;
  averageDurationMs: number;
  commonProblemCategories: Array<{ category: string; count: number }>;
}

// ─── Policies ───────────────────────────────────────────────────────────

export interface AutonomousPolicies {
  autoApproveSafe: boolean;
  requireApprovalForModerate: boolean;
  neverAutoApproveHigh: boolean;
  maxRetries: number;
  rollbackOnRegression: boolean;
  minConfidence: number;
}

// ─── Engineering Input ──────────────────────────────────────────────────

export interface EngineeringInput {
  problem: Problem;
  workspaceState?: { fileCount: number; symbolCount: number };
  analysisResult?: { errorCount: number; warningCount: number };
  visionReport?: { overallScore: number; issueCount: number };
  runtimeState?: { fps: number; jankCount: number; errorCount: number };
  consoleLogs?: { errorCount: number; warningCount: number };
}
