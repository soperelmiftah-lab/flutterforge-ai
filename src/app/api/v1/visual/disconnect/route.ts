import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * POST /api/v1/visual/disconnect
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
  const success = visualState.disconnectDevice(deviceId);
  return NextResponse.json({ data: { success } });
}
