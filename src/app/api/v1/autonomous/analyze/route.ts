import { NextRequest, NextResponse } from "next/server";
import { runPipeline } from "@/features/autonomous/engine";
import { createProblem } from "@/features/autonomous/debugger";
import type { EngineeringInput, ProblemCategory } from "@/features/autonomous/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const problem = createProblem({
    category: (body.category ?? "layout-issue") as ProblemCategory,
    title: body.title ?? "Layout overflow detected",
    description: body.description ?? "Bottom overflowed by 42 pixels in Column widget",
    severity: body.severity ?? "high",
    source: body.source ?? "vision-ai",
    file: body.file ?? "lib/features/home/home_screen.dart",
    line: body.line ?? 24,
    evidence: body.evidence ?? ["Vision AI detected overflow", "Analyzer: 1 error", "Console: no exceptions"],
  });

  const input: EngineeringInput = {
    problem,
    workspaceState: { fileCount: 7, symbolCount: 9 },
    analysisResult: { errorCount: 1, warningCount: 2 },
    visionReport: { overallScore: 74, issueCount: 11 },
    runtimeState: { fps: 58, jankCount: 2, errorCount: 1 },
    consoleLogs: { errorCount: 1, warningCount: 1 },
  };

  const result = await runPipeline(input);
  return NextResponse.json({ data: result });
}
