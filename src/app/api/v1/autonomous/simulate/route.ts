import { NextRequest, NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";
import type { Problem, ProblemCategory } from "@/features/autonomous/types";
import { uid } from "@/lib/utils";

/**
 * POST /api/v1/autonomous/simulate
 *
 * Run simulation + validation + confidence for a problem. Does NOT run
 * the full pipeline — useful for previewing the simulation outcome.
 *
 * Body: { category, title, description, severity, source, file, line, evidence }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem: Problem = {
    id: uid("problem"),
    category: (body.category ?? "layout-issue") as ProblemCategory,
    title: body.title ?? "Layout overflow",
    description: body.description ?? "Bottom overflowed",
    severity: body.severity ?? "high",
    source: body.source ?? "vision-ai",
    file: body.file ?? "lib/main.dart",
    line: body.line,
    evidence: body.evidence ?? [],
  };

  const input = {
    problem,
    workspaceState: { fileCount: 7, symbolCount: 9 },
    analysisResult: { errorCount: 1, warningCount: 2 },
    visionReport: { overallScore: 74, issueCount: 11 },
    runtimeState: { fps: 58, jankCount: 2, errorCount: 1 },
    consoleLogs: { errorCount: 1, warningCount: 1 },
  };
  const result = await autonomousState.runPipeline(input);
  return NextResponse.json({
    data: {
      selected: result.selectedCandidate,
      simulation: result.simulation,
      validation: result.validation,
      confidence: result.confidence,
    },
  });
}
