/**
 * @module features/tool-intelligence/ai-builder
 *
 * AI-driven Tool Chain Builder. Uses the AI Chat Engine (Forge provider
 * backed by the z-ai-web-dev-sdk) to analyze the user's objective and produce
 * an intelligent tool chain with rationale.
 *
 * Flow:
 *   1. Build a catalog of available implemented tools
 *   2. Ask the LLM to pick the best tools for the objective + intent
 *   3. Parse the JSON response into ChainSteps
 *   4. Build a ToolChain (with risk/cost/recommendations) — same shape as the
 *      template-based builder, so downstream code is unchanged.
 *
 * If the AI fails or returns invalid output, the caller falls back to the
 * template-based buildChain() from ./chains.
 */

"use server";

import type { ToolChain, ChainStep, ChainStepType } from "./types";
import type { IntentType } from "@/features/planner/types";
import type { ToolDescriptor } from "@/features/execution/types";
import { listTools, getToolDescriptor } from "@/features/execution/registry";
import { analyzeChainRisk } from "./risk";
import { estimateChainCost } from "./cost";
import { uid } from "@/lib/utils";
import { chat } from "@/features/ai/chat/engine";

/** AI-proposed step (parsed from the LLM JSON response). */
interface AIProposedStep {
  toolId: string;
  type?: ChainStepType;
  reason?: string;
  parameters?: Record<string, unknown>;
  fallbacks?: string[];
  parallelGroup?: string;
}

/** AI analysis result. */
export interface AIChainAnalysis {
  chain: ToolChain;
  rationale: string;
  aiGenerated: true;
}

/** Default Forge model for tool-intelligence reasoning. */
const DEFAULT_MODEL = "glm-4.6";

/**
 * Build a tool chain using AI. Returns null on any failure so the caller can
 * fall back to the template-based builder.
 */
export async function buildChainWithAI(
  taskId: string,
  objective: string,
  intentType: IntentType,
  requiredFiles: string[] = []
): Promise<AIChainAnalysis | null> {
  try {
    const tools = listTools().filter((t) => t.implemented);
    const catalog = buildToolCatalog(tools);

    const prompt = buildPrompt(objective, intentType, requiredFiles, catalog);

    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.2,
      maxTokens: 2000,
      systemPrompt:
        "You are the Tool Intelligence Layer of FlutterForge AI, an AI-native IDE for building Flutter apps. " +
        "Your job is to pick the best sequence of tools (from the provided catalog) to accomplish the user's objective. " +
        "You must respond with strict JSON only — no markdown, no commentary.\n\n" +
        "Output schema:\n" +
        '{\n' +
        '  "rationale": "<2-3 sentences explaining the plan>",\n' +
        '  "steps": [\n' +
        '    {\n' +
        '      "toolId": "<tool id from the catalog>",\n' +
        '      "type": "sequential" | "parallel" | "conditional" | "fallback" | "approval",\n' +
        '      "reason": "<why this tool, one short sentence>",\n' +
        '      "parameters": { "<paramName>": "<value>" },\n' +
        '      "fallbacks": ["<toolId>", ...],\n' +
        '      "parallelGroup": "<optional group id>"\n' +
        '    }\n' +
        '  ]\n' +
        '}\n\n' +
        "Rules:\n" +
        "- Pick between 2 and 6 steps — fewer is better.\n" +
        "- Use only tool ids that exist in the catalog.\n" +
        '- For "parameters", fill in reasonable placeholder values based on the objective (e.g. `path: "lib/main.dart"`).\n' +
        "- Mark write/create/delete operations as type \"approval\".\n" +
        "- For read-only searches, prefer type \"sequential\".\n" +
        "- Use parallelGroup to parallelise independent read-only steps.\n" +
        "- Always start with a read/search step (you need context before modifying).\n" +
        "- Never propose the same tool twice in a row with identical parameters.",
      messages: [
        {
          id: uid("msg"),
          role: "user",
          content: prompt,
        },
      ],
    });

    const parsed = parseAIResponse(response.content);
    if (!parsed) return null;

    const steps = proposedToSteps(parsed.steps, requiredFiles);
    if (steps.length === 0) return null;

    const riskScore = analyzeChainRisk(steps);
    const costEstimate = estimateChainCost(steps);

    const chain: ToolChain = {
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

    return {
      chain,
      rationale: parsed.rationale,
      aiGenerated: true,
    };
  } catch {
    return null;
  }
}

/** Build the tool catalog text for the prompt. */
function buildToolCatalog(tools: ToolDescriptor[]): string {
  return tools
    .map((t) => {
      const params = t.parameters
        .map((p) => `${p.name}${p.required ? "*" : ""}: ${p.type}`)
        .join(", ");
      return `- ${t.id} — ${t.name}. ${t.description} [risk: ${t.riskLevel}, params: ${params || "none"}]`;
    })
    .join("\n");
}

/** Build the user prompt for the LLM. */
function buildPrompt(
  objective: string,
  intentType: IntentType,
  requiredFiles: string[],
  catalog: string
): string {
  const filesLine =
    requiredFiles.length > 0
      ? `\nRelevant files in the workspace: ${requiredFiles.join(", ")}`
      : "\nNo specific files provided — discover them at runtime.";

  return (
    `Objective: "${objective}"\n\n` +
    `Intent type: ${intentType}\n` +
    `Available tools:\n${catalog}\n${filesLine}\n\n` +
    `Return strict JSON only.`
  );
}

/** Parse the LLM response into structured steps. */
function parseAIResponse(
  content: string
): { rationale: string; steps: AIProposedStep[] } | null {
  // The model may wrap JSON in ```json fences despite instructions — strip them.
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();

  // Find the first { ... } block.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);

  let parsed: { rationale?: string; steps?: AIProposedStep[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length === 0) return null;
  if (typeof parsed.rationale !== "string") parsed.rationale = "";

  return {
    rationale: parsed.rationale,
    steps: parsed.steps,
  };
}

/** Convert AI-proposed steps into validated ChainSteps. */
function proposedToSteps(
  proposed: AIProposedStep[],
  _requiredFiles: string[]
): ChainStep[] {
  const validTypes: ChainStepType[] = [
    "sequential",
    "parallel",
    "conditional",
    "fallback",
    "approval",
  ];

  const steps: ChainStep[] = [];
  let prevId: string | undefined;

  proposed.forEach((p, i) => {
    // Validate the tool id exists in the registry.
    const tool = getToolDescriptor(p.toolId);
    if (!tool) return; // skip unknown tool ids

    const stepId = `step_${i}`;
    const type = validTypes.includes(p.type ?? "sequential")
      ? (p.type as ChainStepType)
      : "sequential";

    const step: ChainStep = {
      id: stepId,
      toolId: tool.id,
      toolName: tool.name,
      type,
      parameters: p.parameters ?? {},
      dependsOn: prevId && type !== "parallel" ? [prevId] : [],
      fallbacks: Array.isArray(p.fallbacks) ? p.fallbacks.slice(0, 3) : [],
      requiresApproval: tool.riskLevel !== "safe" || type === "approval",
      estimatedDurationMs: tool.timeoutMs,
      estimatedTokens: tool.category === "search" ? 200 : 100,
      parallelGroup: typeof p.parallelGroup === "string" ? p.parallelGroup : undefined,
    };

    steps.push(step);
    if (type === "sequential" || type === "approval" || type === "fallback") {
      prevId = stepId;
    }
  });

  return steps;
}

/** Build a rollback strategy description. */
function buildRollbackStrategy(steps: ChainStep[]): string {
  const rollbackSteps = steps.filter(
    (s) =>
      s.toolId.startsWith("fs.") &&
      (s.toolId.includes("write") ||
        s.toolId.includes("create") ||
        s.toolId.includes("delete"))
  );
  if (rollbackSteps.length === 0)
    return "No rollback needed — chain is read-only.";
  return `Rollback ${rollbackSteps.length} filesystem mutation(s) via snapshot restore.`;
}
