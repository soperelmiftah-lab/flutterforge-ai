import { NextRequest, NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";

/**
 * POST /api/v1/vision/compare
 *
 * Compare two reports (by report id). Returns visual similarity +
 * layout/widget/theme differences.
 *
 * Body: { screenshotA: string (reportId), screenshotB: string (reportId) }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { screenshotA, screenshotB } = body;
  if (!screenshotA || !screenshotB) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "screenshotA and screenshotB (report ids) are required" } },
      { status: 400 }
    );
  }
  const result = visionState.compare(screenshotA, screenshotB);
  if (!result) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "One or both reports not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: result });
}
