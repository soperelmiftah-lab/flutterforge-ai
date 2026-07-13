import { NextRequest, NextResponse } from "next/server";
import { simulatePatch } from "@/features/autonomous/simulation";
import { validatePatch } from "@/features/autonomous/validation";
import { computeConfidence } from "@/features/autonomous/confidence";
import { analyzeRootCause } from "@/features/autonomous/root-cause";
import { createProblem } from "@/features/autonomous/debugger";
import { planRepair, selectBestCandidate } from "@/features/autonomous/patch-planner";
import type { ProblemCategory } from "@/features/autonomous/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem = createProblem({
    category: (body.category ?? "layout-issue") as ProblemCategory,
    title: body.title ?? "Layout overflow",
    description: body.description ?? "Bottom overflowed",
    severity: "high", source: "vision-ai", file: "lib/main.dart",
    evidence: [],
  });
  const rootCause = analyzeRootCause(problem);
  const plan = planRepair(problem, rootCause);
  const selected = selectBestCandidate(plan.candidates);
  const simulation = simulatePatch(selected);
  const validation = validatePatch(selected);
  const confidence = computeConfidence({
    rootCauseConfidence: rootCause.confidence,
    simulationSuccess: simulation.successProbability,
    validationScore: validation.score,
    hasEvidence: true,
    hasAlternatives: true,
  });
  return NextResponse.json({ data: { selected, simulation, validation, confidence } });
}
