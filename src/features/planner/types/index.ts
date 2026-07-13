/**
 * @module features/planner/types
 *
 * Core domain types for the Planner & Orchestrator. These define the
 * vocabulary of the Agent Operating System: intents, goals, tasks, plans,
 * agents, workflows, timelines, and evaluations.
 */

// ─── Intent ─────────────────────────────────────────────────────────────

/** The kind of request the user made. Drives planning. */
export type IntentType =
  | "question"
  | "bug-fix"
  | "feature-request"
  | "refactor"
  | "code-review"
  | "generate-ui"
  | "generate-api"
  | "generate-database"
  | "generate-flutter-app"
  | "analyze-project"
  | "explain-code"
  | "documentation"
  | "testing"
  | "deployment";

export interface Intent {
  type: IntentType;
  confidence: number;
  rawInput: string;
  detectedAt: string;
  /** Keywords that triggered the detection. */
  keywords: string[];
}

// ─── Goals & objectives ─────────────────────────────────────────────────

export interface Goal {
  id: string;
  title: string;
  description: string;
  intentType: IntentType;
  objectives: Objective[];
  createdAt: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  taskIds: string[];
  completed: boolean;
}

// ─── Tasks ──────────────────────────────────────────────────────────────

export type TaskStatus =
  | "pending"
  | "blocked"
  | "ready"
  | "scheduled"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

export type TaskPriority = "low" | "normal" | "high" | "critical";

export type ComplexityLevel = "trivial" | "simple" | "moderate" | "complex" | "very-complex";

export interface Task {
  id: string;
  title: string;
  description: string;
  /** Parent task id (for subtasks). */
  parentId?: string;
  /** Subtask ids. */
  subtaskIds: string[];
  /** Task ids this task depends on (must complete first). */
  dependsOn: string[];
  /** Task ids that depend on this one. */
  dependents: string[];
  status: TaskStatus;
  priority: TaskPriority;
  complexity: ComplexityLevel;
  /** Estimated duration in ms. */
  estimatedDurationMs: number;
  /** Actual duration when completed. */
  actualDurationMs?: number;
  /** Required tool ids (from the Execution Engine registry). */
  requiredTools: string[];
  /** Assigned agent id. */
  assignedAgentId?: string;
  /** Progress 0-100. */
  progress: number;
  /** Execution result, if any. */
  result?: unknown;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

// ─── Task Graph (DAG) ───────────────────────────────────────────────────

export interface TaskGraph {
  tasks: Map<string, Task>;
  /** Edges: dependency → dependent (A must finish before B). */
  edges: Array<{ from: string; to: string }>;
  /** The critical path (longest chain). */
  criticalPath: string[];
  builtAt: string;
}

// ─── Plan ───────────────────────────────────────────────────────────────

export type ExecutionStrategyKind =
  | "sequential"
  | "parallel"
  | "hybrid"
  | "priority-based"
  | "risk-based"
  | "token-optimized";

export interface ExecutionStrategy {
  kind: ExecutionStrategyKind;
  /** Max concurrent tasks (for parallel/hybrid). */
  maxConcurrent: number;
  /** Rationale for the chosen strategy. */
  rationale: string;
}

export interface Plan {
  id: string;
  goalId: string;
  intentType: IntentType;
  tasks: Task[];
  graph: TaskGraph;
  strategy: ExecutionStrategy;
  /** Required agent ids. */
  requiredAgents: string[];
  /** Total estimated duration. */
  estimatedDurationMs: number;
  /** Total estimated tokens. */
  estimatedTokens: number;
  status: "draft" | "approved" | "executing" | "completed" | "failed";
  createdAt: string;
}

// ─── Agents ─────────────────────────────────────────────────────────────

export type AgentStatus = "idle" | "busy" | "error" | "offline";

export type AgentCategory =
  | "planning"
  | "flutter"
  | "ui"
  | "state"
  | "backend"
  | "api"
  | "database"
  | "testing"
  | "debug"
  | "review"
  | "security"
  | "performance"
  | "docs"
  | "i18n"
  | "git"
  | "deployment";

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  category: AgentCategory;
  icon: string;
  /** What this agent can do. */
  capabilities: string[];
  /** Tool ids this agent is allowed to use. */
  allowedTools: string[];
  /** Model ids this agent prefers. */
  allowedModels: string[];
  priority: TaskPriority;
  status: AgentStatus;
  version: string;
  health: "healthy" | "degraded" | "down";
  /** Whether the agent is implemented (true) or a placeholder (false). */
  implemented: boolean;
}

// ─── Workflows ──────────────────────────────────────────────────────────

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  /** Agent id that should handle this step. */
  agentId: string;
  /** Tool ids needed. */
  requiredTools: string[];
  /** Step ids that must complete first. */
  dependsOn: string[];
  estimatedDurationMs: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  steps: WorkflowStep[];
  /** Total estimated duration. */
  estimatedDurationMs: number;
  createdAt: string;
}

// ─── Thinking & Timeline ────────────────────────────────────────────────

export type ThinkingPhase =
  | "understanding-request"
  | "analyzing-workspace"
  | "searching-context"
  | "planning-tasks"
  | "selecting-agents"
  | "selecting-tools"
  | "estimating-complexity"
  | "generating-workflow"
  | "waiting-approval"
  | "executing"
  | "evaluating"
  | "finished";

export interface ThinkingStep {
  id: string;
  phase: ThinkingPhase;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  /** Output/details of this thinking step. */
  output?: string;
}

export type TimelineEventType =
  | "intent-detected"
  | "goal-created"
  | "plan-created"
  | "task-scheduled"
  | "task-started"
  | "task-completed"
  | "task-failed"
  | "agent-assigned"
  | "approval-requested"
  | "approval-granted"
  | "approval-rejected"
  | "thinking-phase"
  | "workflow-started"
  | "workflow-completed"
  | "evaluation-completed";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  timestamp: string;
  taskId?: string;
  agentId?: string;
  metadata?: unknown;
}

// ─── Evaluation ─────────────────────────────────────────────────────────

export interface Evaluation {
  id: string;
  planId: string;
  /** Overall success 0-1. */
  successRate: number;
  /** Tasks completed vs total. */
  tasksCompleted: number;
  tasksTotal: number;
  /** Execution quality 0-1. */
  quality: number;
  errorCount: number;
  retryCount: number;
  /** Total actual duration. */
  totalDurationMs: number;
  /** Estimated vs actual ratio. */
  estimateAccuracy: number;
  /** Confidence in the result 0-1. */
  confidence: number;
  notes: string[];
  createdAt: string;
}

// ─── Reasoning ──────────────────────────────────────────────────────────

export type ReasoningDepth = "fast" | "balanced" | "deep" | "exhaustive";

export interface ReasoningConfig {
  depth: ReasoningDepth;
  /** Max thinking steps before proceeding. */
  maxSteps: number;
  /** Whether to show reasoning to the user. */
  showReasoning: boolean;
}

// ─── Memory ─────────────────────────────────────────────────────────────

export interface PlannerMemory {
  /** Past plans for similar intents. */
  pastPlans: Array<{ intentType: IntentType; planId: string; successRate: number }>;
  /** Workflow usage history. */
  workflowHistory: Array<{ workflowId: string; usedAt: string; success: boolean }>;
  /** Agent performance history. */
  agentPerformance: Array<{ agentId: string; avgDurationMs: number; successRate: number }>;
  /** Planning accuracy over time. */
  planningAccuracy: number[];
}

// ─── Sessions ───────────────────────────────────────────────────────────

export interface PlanningSession {
  id: string;
  title: string;
  intent: Intent;
  goal: Goal;
  plan?: Plan;
  evaluation?: Evaluation;
  timeline: TimelineEvent[];
  thinkingSteps: ThinkingStep[];
  status: "active" | "completed" | "archived";
  createdAt: string;
  updatedAt: string;
}

// ─── Policies ───────────────────────────────────────────────────────────

export interface PlannerPolicies {
  maxParallelAgents: number;
  maxRetries: number;
  approvalPolicy: "never" | "risky-only" | "always";
  riskPolicy: "allow-all" | "block-critical" | "manual-review";
  tokenBudget: number;
  timeoutMs: number;
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface PlannerMetrics {
  averagePlanningTimeMs: number;
  averageTaskCount: number;
  agentUtilization: Array<{ agentId: string; utilization: number; taskCount: number }>;
  workflowSuccessRate: number;
  planningAccuracy: number;
  retryCount: number;
  executionSuccessRate: number;
  totalSessions: number;
  totalPlans: number;
}
