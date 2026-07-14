import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/device/detach
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
  const ok = runtimeState.detachDevice(deviceId);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Device not found: ${deviceId}` } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: { detached: true, deviceId } });
}
