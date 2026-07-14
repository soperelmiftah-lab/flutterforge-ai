import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/frames
 *
 * Returns the frame stats history (newest first) + latest snapshot.
 *
 * POST /api/v1/visual/frames
 *   Body: { action: "capture" | "reset" }
 */
export async function GET() {
  const history = visualState.getFrameHistory();
  return NextResponse.json({
    data: history,
    latest: visualState.getLatestFrameStats(),
    total: history.length,
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  if (body.action === "reset") {
    visualState.resetJankStats();
    return NextResponse.json({ data: { reset: true } });
  }
  // Default: capture a new frame snapshot.
  const stats = visualState.captureFrameStats();
  return NextResponse.json({ data: stats });
}
