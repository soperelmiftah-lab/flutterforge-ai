import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * POST /api/v1/visual/orientation
 *
 * Toggle the orientation of a device (portrait ↔ landscape).
 * Body: { deviceId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { deviceId } = body;
  if (!deviceId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "deviceId is required" } },
      { status: 400 }
    );
  }
  const device = visualState.toggleOrientation(deviceId);
  if (!device) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Device not found: ${deviceId}` } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: device });
}
