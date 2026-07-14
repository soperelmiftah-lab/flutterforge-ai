import { NextRequest, NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";
import { enhanceWithAI } from "@/features/autonomous/ai-analysis";
import type { Problem, ProblemCategory } from "@/features/autonomous/types";
import { uid } from "@/lib/utils";

/**
 * POST /api/v1/autonomous/repair
 *
 * Run only the repair-planning stage (root cause + patch candidates).
 * Does NOT run the full pipeline. Useful for previewing repair options.
 *
 * Body: { category, title, description, severity, source, file, line, evidence, useAI }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem: Problem = {
    id: uid("problem"),
    category: (body.category ?? "layout-issue") as ProblemCategory,
    title: body.title ?? "Layout overflow",
    description: body.description ?? "Bottom overflowed by 42 pixels",
    severity: body.severity ?? "high",
    source: body.source ?? "vision-ai",
    file: body.file ?? "lib/main.dart",
    line: body.line,
    evidence: body.evidence ?? [],
  };

  // Run a mini-pipeline (just root cause + repair plan).
  const input = {
    problem,
    workspaceState: { fileCount: 7, symbolCount: 9 },
    analysisResult: { errorCount: 1, warningCount: 2 },
    visionReport: { overallScore: 74, issueCount: 11 },
    runtimeState: { fps: 58, jankCount: 2, errorCount: 1 },
    consoleLogs: { errorCount: 1, warningCount: 1 },
  };
  const result = await autonomousState.runPipeline(input);

  // Enhance with AI if requested.
  if (body.useAI !== false) {
    try {
      const enhanced = await enhanceWithAI(problem, result.rootCause, result.repairPlan);
      return NextResponse.json({
        data: {
          problem,
          rootCause: enhanced.rootCause,
          plan: enhanced.plan,
          selected: enhanced.plan.candidates.find((c) => c.id === result.repairPlan.selectedCandidateId) ?? enhanced.plan.candidates[0],
          aiRationale: enhanced.aiRationale,
        },
      });
    } catch { /* fall through */ }
  }

  const selected = result.repairPlan.candidates.find((c) => c.id === result.repairPlan.selectedCandidateId) ?? result.repairPlan.candidates[0];
  return NextResponse.json({ data: { problem, rootCause: result.rootCause, plan: result.repairPlan, selected } });
}
