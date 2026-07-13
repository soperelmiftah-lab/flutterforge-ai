/**
 * @module features/tool-intelligence/chains
 *
 * Tool Chain Builder — constructs execution pipelines from tool selections.
 * Supports sequential, parallel, conditional, fallback, retry, and rollback.
 */

import type { ToolChain, ChainStep, ChainStepType } from "../types";
import { getToolDescriptor } from "@/features/execution/registry";
import { analyzeChainRisk } from "../risk";
import { estimateChainCost } from "../cost";
import { uid } from "@/lib/utils";
import type { IntentType } from "@/features/planner/types";

/** Build a tool chain for an objective. */
export function buildChain(
  taskId: string,
  objective: string,
  intentType: IntentType,
  requiredFiles: string[] = []
): ToolChain {
  const steps = generateSteps(intentType, requiredFiles);
  const riskScore = analyzeChainRisk(steps);
  const costEstimate = estimateChainCost(steps);

  return {
    id: uid("chain"),
    taskId,
    objective,
    steps,
    totalEstimatedDurationMs: costEstimate.executionTimeMs,
    totalEstimatedTokens: costEstimate.tokenUsage,
    riskScore: riskScore.overall,
    costEstimate,
    rollbackStrategy: buildRollbackStrategy(steps),
    createdAt: new Date().toISOString(),
    optimized: false,
  };
}

/** Generate chain steps based on intent type. */
function generateSteps(intentType: IntentType, requiredFiles: string[]): ChainStep[] {
  const templates = CHAIN_TEMPLATES[intentType] ?? CHAIN_TEMPLATES.question;
  const steps: ChainStep[] = [];
  let prevId: string | undefined;

  for (let i = 0; i < templates.length; i++) {
    const tmpl = templates[i];
    const tool = getToolDescriptor(tmpl.toolId);
    if (!tool) continue;

    const stepId = `step_${i}`;
    const step: ChainStep = {
      id: stepId,
      toolId: tool.id,
      toolName: tool.name,
      type: tmpl.type,
      parameters: tmpl.parameters ?? {},
      dependsOn: prevId ? [prevId] : [],
      fallbacks: tmpl.fallbacks ?? [],
      requiresApproval: tool.riskLevel !== "safe",
      estimatedDurationMs: tool.timeoutMs,
      estimatedTokens: tool.category === "search" ? 200 : 100,
      parallelGroup: tmpl.parallelGroup,
      condition: tmpl.condition,
    };
    steps.push(step);
    if (tmpl.type === "sequential") prevId = stepId;
  }

  return steps;
}

/** Chain templates per intent type. */
interface ChainTemplate {
  toolId: string;
  type: ChainStepType;
  parameters?: Record<string, unknown>;
  fallbacks?: string[];
  parallelGroup?: string;
  condition?: string;
}

const CHAIN_TEMPLATES: Record<IntentType, ChainTemplate[]> = {
  question: [
    { toolId: "search.find_text", type: "sequential" },
    { toolId: "fs.read_file", type: "sequential" },
  ],
  "bug-fix": [
    { toolId: "search.find_text", type: "sequential", fallbacks: ["search.find_symbol"] },
    { toolId: "fs.read_file", type: "sequential" },
    { toolId: "fs.write_file", type: "approval", fallbacks: ["editor.replace_range"] },
    { toolId: "flutter.analyze", type: "sequential" },
  ],
  "feature-request": [
    { toolId: "search.find_file", type: "sequential" },
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "fs.create_file", type: "approval", parallelGroup: "tests" },
    { toolId: "flutter.test", type: "sequential", condition: "tests_exist" },
  ],
  refactor: [
    { toolId: "fs.read_file", type: "sequential" },
    { toolId: "editor.replace_range", type: "approval", fallbacks: ["fs.write_file"] },
    { toolId: "flutter.analyze", type: "sequential" },
  ],
  "code-review": [
    { toolId: "fs.read_file", type: "sequential" },
    { toolId: "search.find_symbol", type: "sequential" },
  ],
  "generate-ui": [
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "fs.write_file", type: "approval", fallbacks: ["editor.insert_text"] },
  ],
  "generate-api": [
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "fs.create_file", type: "approval", parallelGroup: "models" },
  ],
  "generate-database": [
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "fs.create_file", type: "approval", parallelGroup: "migrations" },
  ],
  "generate-flutter-app": [
    { toolId: "fs.create_directory", type: "sequential" },
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "fs.create_file", type: "approval" },
  ],
  "analyze-project": [
    { toolId: "fs.list_directory", type: "sequential" },
    { toolId: "search.find_symbol", type: "sequential" },
  ],
  "explain-code": [
    { toolId: "fs.read_file", type: "sequential" },
  ],
  documentation: [
    { toolId: "search.find_symbol", type: "sequential" },
    { toolId: "fs.write_file", type: "approval" },
  ],
  testing: [
    { toolId: "search.find_symbol", type: "sequential" },
    { toolId: "fs.create_file", type: "approval" },
    { toolId: "flutter.test", type: "sequential" },
  ],
  deployment: [
    { toolId: "flutter.build_apk", type: "approval" },
  ],
};

/** Build a rollback strategy description. */
function buildRollbackStrategy(steps: ChainStep[]): string {
  const rollbackSteps = steps.filter((s) => s.toolId.startsWith("fs.") && (s.toolId.includes("write") || s.toolId.includes("create") || s.toolId.includes("delete")));
  if (rollbackSteps.length === 0) return "No rollback needed — chain is read-only.";
  return `Rollback ${rollbackSteps.length} filesystem mutation(s) via snapshot restore.`;
}

/** Get chain templates for UI. */
export function listChainTemplates(): Array<{ intentType: IntentType; stepCount: number }> {
  return Object.entries(CHAIN_TEMPLATES).map(([intentType, templates]) => ({
    intentType: intentType as IntentType,
    stepCount: templates.length,
  }));
}
