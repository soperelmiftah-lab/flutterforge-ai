import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/vision?deviceId=<id>
 *
 * Returns a structured visual context snapshot for AI consumption.
 */
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? "emulator-5554";
  const context = visualState.buildVisionContext(deviceId);
  return NextResponse.json({ data: context });
}
