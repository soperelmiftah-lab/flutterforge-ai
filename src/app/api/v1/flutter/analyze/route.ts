import { NextRequest, NextResponse } from "next/server";
import { analyzeFlutterCode } from "@/features/flutter-platform/analysis";

/**
 * POST /api/v1/flutter/analyze
 *
 * AI-driven project analysis for a Dart/Flutter code snippet.
 * Body: { code: string }
 *
 * Response: { data: FlutterAnalysisResult }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { code } = body;

  if (!code?.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "code is required" } },
      { status: 400 }
    );
  }

  try {
    const result = await analyzeFlutterCode(code);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "ANALYZE_FAILED",
          message: e instanceof Error ? e.message : "Analysis failed",
        },
      },
      { status: 500 }
    );
  }
}
