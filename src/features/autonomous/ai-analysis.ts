/**
 * @module features/autonomous/ai-analysis
 *
 * AI-driven problem analysis for the Autonomous Engineering System.
 * Uses the Forge chat engine to produce a richer root-cause analysis
 * and a smarter repair-plan rationale based on the problem description
 * + evidence.
 *
 * Falls back to the heuristic analysis if the AI is unavailable.
 */

"use server";

import { chat } from "@/features/ai/chat/engine";
import { uid } from "@/lib/utils";
import type { Problem, RootCause, RepairPlan, PatchCandidate } from "./types";

const DEFAULT_MODEL = "glm-4.6";

/**
 * Enhance a heuristic root cause + repair plan with AI analysis.
 * Returns the enhanced root cause and repair plan.
 */
export async function enhanceWithAI(
  problem: Problem,
  heuristicRootCause: RootCause,
  heuristicPlan: RepairPlan
): Promise<{ rootCause: RootCause; plan: RepairPlan; aiRationale: string }> {
  try {
    const prompt = buildPrompt(problem, heuristicRootCause, heuristicPlan);
    const response = await chat({
      provider: "forge",
      model: DEFAULT_MODEL,
      temperature: 0.2,
      maxTokens: 1000,
      systemPrompt:
        "You are FlutterForge AI's autonomous engineering analyst. You receive a problem description, " +
        "heuristic root-cause analysis, and candidate repair patches. Your job is to:\n" +
        "1. Refine the root cause with deeper insight.\n" +
        "2. Write a 2-3 sentence rationale explaining why the selected patch is the best choice.\n" +
        "3. Suggest one additional alternative patch not in the list.\n\n" +
        "Respond with STRICT JSON only — no markdown:\n" +
        "{\n" +
        '  "refinedRootCause": "...",\n' +
        '  "rationale": "...",\n' +
        '  "extraPatch": {\n' +
        '    "title": "...",\n' +
        '    "description": "...",\n' +
        '    "riskLevel": "safe" | "moderate" | "high" | "critical",\n' +
        '    "expectedOutcome": "...",\n' +
        '    "sideEffects": ["..."],\n' +
        '    "failureProbability": 0.0-1.0,\n' +
        '    "estimatedComplexity": "trivial" | "simple" | "moderate" | "complex"\n' +
        "  }\n" +
        "}",
      messages: [
        { id: uid("msg"), role: "user", content: prompt },
      ],
    });

    const parsed = parseResponse(response.content);
    if (!parsed) {
      return { rootCause: heuristicRootCause, plan: heuristicPlan, aiRationale: "" };
    }

    const enhancedRootCause: RootCause = {
      ...heuristicRootCause,
      rootCause: parsed.refinedRootCause ?? heuristicRootCause.rootCause,
    };

    const candidates = [...heuristicPlan.candidates];
    if (parsed.extraPatch) {
      const extra: PatchCandidate = {
        id: uid("patch"),
        title: parsed.extraPatch.title,
        description: parsed.extraPatch.description,
        affectedFiles: problem.file ? [problem.file] : ["lib/main.dart"],
        riskLevel: parsed.extraPatch.riskLevel ?? "moderate",
        expectedOutcome: parsed.extraPatch.expectedOutcome ?? "",
        sideEffects: parsed.extraPatch.sideEffects ?? [],
        failureProbability: parsed.extraPatch.failureProbability ?? 0.2,
        estimatedComplexity: parsed.extraPatch.estimatedComplexity ?? "simple",
      };
      candidates.push(extra);
    }

    const enhancedPlan: RepairPlan = {
      ...heuristicPlan,
      candidates,
      rationale: parsed.rationale ?? heuristicPlan.rationale,
    };

    return {
      rootCause: enhancedRootCause,
      plan: enhancedPlan,
      aiRationale: parsed.rationale ?? "",
    };
  } catch {
    return { rootCause: heuristicRootCause, plan: heuristicPlan, aiRationale: "" };
  }
}

function buildPrompt(problem: Problem, rc: RootCause, plan: RepairPlan): string {
  return (
    `Problem: ${problem.title}\n` +
    `Category: ${problem.category}\n` +
    `Description: ${problem.description}\n` +
    `Severity: ${problem.severity}\n` +
    `File: ${problem.file ?? "unknown"}:${problem.line ?? "?"}\n` +
    `Evidence: ${problem.evidence.join("; ")}\n\n` +
    `Heuristic root cause: ${rc.rootCause}\n` +
    `Contributing factors: ${rc.contributingFactors.join("; ")}\n\n` +
    `Candidate patches:\n${plan.candidates.map((c, i) => `  ${i + 1}. ${c.title} (risk: ${c.riskLevel}, failure: ${(c.failureProbability * 100).toFixed(0)}%)`).join("\n")}\n\n` +
    `Return strict JSON with a refined root cause, rationale for the selected patch, and one extra alternative.`
  );
}

function parseResponse(content: string): {
  refinedRootCause?: string;
  rationale?: string;
  extraPatch?: {
    title: string;
    description: string;
    riskLevel?: PatchCandidate["riskLevel"];
    expectedOutcome?: string;
    sideEffects?: string[];
    failureProbability?: number;
    estimatedComplexity?: PatchCandidate["estimatedComplexity"];
  };
} | null {
  let text = content.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  text = text.slice(start, end + 1);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
