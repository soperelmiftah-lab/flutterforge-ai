import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/devices
 *
 * Returns the device registry + connected device count.
 */
export async function GET() {
  const devices = visualState.listDevices();
  const connected = visualState.listConnectedDevices();
  return NextResponse.json({
    data: devices,
    total: devices.length,
    connected: connected.length,
  });
}
