import { NextRequest, NextResponse } from "next/server";
import { analyzePerformance } from "@/features/flutter-platform/performance";

/**
 * POST /api/v1/flutter/performance
 *
 * AI-driven performance analysis for a Dart/Flutter code snippet.
 * Body: { code: string }
 *
 * Response: { data: PerformanceReport }
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
    const result = await analyzePerformance(code);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "PERFORMANCE_FAILED",
          message: e instanceof Error ? e.message : "Performance analysis failed",
        },
      },
      { status: 500 }
    );
  }
}
