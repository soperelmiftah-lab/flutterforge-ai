import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * POST /api/v1/visual/compare
 *
 * Compare two screenshots. Returns pixel/structural/widget differences.
 * Body: { screenshotAId: string, screenshotBId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { screenshotAId, screenshotBId } = body;
  if (!screenshotAId || !screenshotBId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "screenshotAId and screenshotBId are required" } },
      { status: 400 }
    );
  }
  const result = visualState.compareScreenshots(screenshotAId, screenshotBId);
  if (!result) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "One or both screenshots not found" } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: result });
}
