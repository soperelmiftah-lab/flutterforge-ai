import { NextResponse } from "next/server";
import { discoverDevices, getConnectedDevices } from "@/features/visual-runtime/adb";
export async function GET() {
  const devices = discoverDevices();
  const connected = getConnectedDevices();
  return NextResponse.json({ data: devices, total: devices.length, connected: connected.length });
}
