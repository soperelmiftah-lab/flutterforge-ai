import { NextRequest, NextResponse } from "next/server";
import { reviewDartCode } from "@/features/flutter-platform/review";

/**
 * POST /api/v1/flutter/review
 *
 * AI-driven code review for a Dart/Flutter code snippet.
 * Body: { code: string }
 *
 * Response: { data: ReviewResult }
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
    const result = await reviewDartCode(code);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "REVIEW_FAILED",
          message: e instanceof Error ? e.message : "Review failed",
        },
      },
      { status: 500 }
    );
  }
}
