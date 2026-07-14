import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/device-farm
 *
 * Returns the device farm + available device count.
 */
export async function GET() {
  return NextResponse.json({
    data: cloudState.listDevices(),
    available: cloudState.getAvailableDevices().length,
  });
}

/**
 * POST /api/v1/cloud/device-farm
 *
 * Reserve or release a device.
 * Body: { action: "reserve" | "release", deviceId, reservedBy? }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action, deviceId, reservedBy } = body;
  if (action === "reserve") {
    return NextResponse.json({ data: { success: cloudState.reserveDevice(deviceId, reservedBy ?? "user") } });
  }
  if (action === "release") {
    return NextResponse.json({ data: { success: cloudState.releaseDevice(deviceId) } });
  }
  return NextResponse.json({ error: { code: "INVALID_ACTION" } }, { status: 400 });
}
