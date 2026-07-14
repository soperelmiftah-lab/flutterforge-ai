import { NextRequest, NextResponse } from "next/server";
import { detectRepairIssues } from "@/features/flutter-platform/repair";

/**
 * POST /api/v1/flutter/repair
 *
 * AI-driven repair detection for a Dart/Flutter code snippet.
 * Body: { code: string }
 *
 * Response: { data: RepairResult }
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
    const result = await detectRepairIssues(code);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "REPAIR_FAILED",
          message: e instanceof Error ? e.message : "Repair failed",
        },
      },
      { status: 500 }
    );
  }
}
