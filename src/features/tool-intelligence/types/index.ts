/**
 * @module features/tool-intelligence/types
 *
 * Core domain types for the Tool Intelligence Layer. These define how the
 * system reasons about tool selection, chain building, simulation, risk,
 * cost, recovery, and optimization.
 */

import type { RiskLevel } from "@/features/execution/types";
import type { IntentType } from "@/features/planner/types";
import type { ToolDescriptor } from "@/features/execution/types";

// ─── Capability Analysis ────────────────────────────────────────────────

export interface CapabilityAnalysis {
  taskId: string;
  intentType: IntentType;
  requiredCapabilities: string[];
  availableTools: ToolDescriptor[];
  availableAgents: string[];
  requiredFiles: string[];
  workspaceReady: boolean;
  gaps: string[];
}

// ─── Tool Selection ─────────────────────────────────────────────────────

export interface SelectionCriteria {
  capability: number;   // 0-1 how well the tool matches the task
  safety: number;       // 0-1 lower risk = higher safety
  performance: number;  // 0-1 faster = higher
  tokenCost: number;    // 0-1 fewer tokens = higher
  reliability: number;  // 0-1 success rate
  risk: number;         // 0-1 lower risk = higher score
}

export interface ToolSelection {
  toolId: string;
  toolName: string;
  score: number;          // 0-1 overall
  criteria: SelectionCriteria;
  rationale: string;
  alternatives: string[]; // other tool ids that could work
}

// ─── Tool Chains ────────────────────────────────────────────────────────

export type ChainStepType = "sequential" | "parallel" | "conditional" | "fallback" | "approval";

export interface ChainStep {
  id: string;
  toolId: string;
  toolName: string;
  type: ChainStepType;
  parameters: Record<string, unknown>;
  dependsOn: string[];
  /** Fallback tool ids if this step fails. */
  fallbacks: string[];
  /** Whether this step requires approval. */
  requiresApproval: boolean;
  /** Estimated duration in ms. */
  estimatedDurationMs: number;
  /** Estimated token cost. */
  estimatedTokens: number;
  /** Parallel group id (steps in the same group run concurrently). */
  parallelGroup?: string;
  /** Condition for conditional steps (evaluated at runtime). */
  condition?: string;
}

export interface ToolChain {
  id: string;
  taskId: string;
  objective: string;
  steps: ChainStep[];
  totalEstimatedDurationMs: number;
  totalEstimatedTokens: number;
  riskScore: number;       // 0-1
  costEstimate: CostEstimate;
  rollbackStrategy: string;
  createdAt: string;
  optimized: boolean;
}

// ─── Simulation ─────────────────────────────────────────────────────────

export interface SimulationResult {
  chainId: string;
  dryRun: true;
  predictedOutputs: Array<{ stepId: string; toolId: string; predictedOutput: string }>;
  predictedPatches: Array<{ stepId: string; path: string; linesAdded: number; linesRemoved: number }>;
  predictedDurationMs: number;
  predictedTokens: number;
  predictedRisk: number;
  approvalRequired: boolean;
  approvalSteps: string[];
  warnings: string[];
  success: boolean;
  simulatedAt: string;
}

// ─── Risk ───────────────────────────────────────────────────────────────

export interface RiskScore {
  overall: number;         // 0-1 (0 = safe, 1 = critical)
  filesystem: number;
  terminal: number;
  flutter: number;
  git: number;
  network: number;
  projectImpact: number;
  level: RiskLevel;
  factors: string[];
}

// ─── Cost ───────────────────────────────────────────────────────────────

export interface CostEstimate {
  executionTimeMs: number;
  cpuUsage: "low" | "medium" | "high";
  memoryUsage: "low" | "medium" | "high";
  tokenUsage: number;
  workspaceChanges: number;  // number of files affected
  patchCount: number;
  monetaryCost: number;      // estimated USD (0 for free tools)
}

// ─── Recovery ───────────────────────────────────────────────────────────

export type RecoveryAction = "retry" | "alternative" | "rollback" | "resume" | "skip" | "escalate";

export interface RecoveryPlan {
  failedStepId: string;
  failedToolId: string;
  action: RecoveryAction;
  alternativeToolId?: string;
  rollbackSteps: string[];
  maxRetries: number;
  retryCount: number;
  escalateTo: string;
  reason: string;
}

// ─── Recommendations ────────────────────────────────────────────────────

export type RecommendationKind = "safer" | "faster" | "cheaper" | "more-reliable";

export interface Recommendation {
  id: string;
  kind: RecommendationKind;
  title: string;
  description: string;
  originalChainId: string;
  suggestedChainId?: string;
  improvements: {
    timeSavedMs?: number;
    tokensSaved?: number;
    riskReduced?: number;
    reliabilityGain?: number;
  };
  createdAt: string;
}

// ─── Policies ───────────────────────────────────────────────────────────

export interface ToolIntelligencePolicies {
  maxToolsPerChain: number;
  maxRetries: number;
  approvalPolicy: "never" | "risky-only" | "always";
  riskTolerance: "low" | "medium" | "high";
  simulationRequired: boolean;
  timeoutMs: number;
}

// ─── Learning ───────────────────────────────────────────────────────────

export interface ToolLearningRecord {
  toolId: string;
  chainId: string;
  success: boolean;
  durationMs: number;
  tokensUsed: number;
  usedAt: string;
}

export interface ToolLearningSummary {
  toolId: string;
  totalUses: number;
  successCount: number;
  failureCount: number;
  averageDurationMs: number;
  averageTokens: number;
  reliability: number;
  commonChains: string[];
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface ToolIntelligenceMetrics {
  totalChains: number;
  averageChainLength: number;
  retryCount: number;
  simulationAccuracy: number;
  failureRate: number;
  recoveryRate: number;
  optimizationScore: number;
  toolUsage: Array<{ toolId: string; usageCount: number }>;
}

// ─── Negotiation ────────────────────────────────────────────────────────

export interface ToolNegotiationResult {
  objective: string;
  candidates: Array<{ toolId: string; score: number; reason: string }>;
  winner: string;
  rationale: string;
}

// ─── Validation ─────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checkedAt: string;
}
