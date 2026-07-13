import { NextRequest, NextResponse } from "next/server";
import { planRepair, selectBestCandidate } from "@/features/autonomous/patch-planner";
import { analyzeRootCause } from "@/features/autonomous/root-cause";
import { createProblem } from "@/features/autonomous/debugger";
import type { ProblemCategory } from "@/features/autonomous/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem = createProblem({
    category: (body.category ?? "layout-issue") as ProblemCategory,
    title: body.title ?? "Layout overflow",
    description: body.description ?? "Bottom overflowed by 42 pixels",
    severity: "high",
    source: "vision-ai",
    file: body.file ?? "lib/main.dart",
    evidence: body.evidence ?? [],
  });
  const rootCause = analyzeRootCause(problem);
  const plan = planRepair(problem, rootCause);
  const selected = selectBestCandidate(plan.candidates);
  return NextResponse.json({ data: { problem, rootCause, plan, selected } });
}
