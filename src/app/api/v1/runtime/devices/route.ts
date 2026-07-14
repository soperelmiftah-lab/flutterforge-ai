import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/devices
 *
 * Returns the device registry (booted + attached devices).
 */
export async function GET() {
  const devices = runtimeState.listDevices();
  return NextResponse.json({ data: devices, total: devices.length });
}
