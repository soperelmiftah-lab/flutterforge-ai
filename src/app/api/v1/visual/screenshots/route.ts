import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/screenshots
 *
 * Returns captured screenshots. Filter by ?deviceId=.
 */
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? undefined;
  const screenshots = visualState.listScreenshots(deviceId);
  return NextResponse.json({ data: screenshots, total: screenshots.length });
}

/**
 * DELETE /api/v1/visual/screenshots
 *
 * Clear all screenshots (or by ?deviceId=).
 */
export async function DELETE(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? undefined;
  if (deviceId) {
    // Delete only for this device.
    const all = visualState.listScreenshots();
    for (const s of all) {
      if (s.deviceId === deviceId) visualState.deleteScreenshot(s.id);
    }
  } else {
    visualState.clearScreenshots();
  }
  return new NextResponse(null, { status: 204 });
}
