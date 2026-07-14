import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import type { DeviceInfo, DevicePlatform } from "@/features/flutter-runtime/types";
import { uid } from "@/lib/utils";

/**
 * POST /api/v1/runtime/device/attach
 *
 * Attach a new device to the registry.
 * Body: { name: string, platform: DevicePlatform, isEmulator?: boolean, isWireless?: boolean }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { name, platform } = body;
  if (!name || !platform) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "name and platform are required" } },
      { status: 400 }
    );
  }
  const device: DeviceInfo = {
    id: uid("dev"),
    name,
    platform: platform as DevicePlatform,
    isEmulator: body.isEmulator ?? false,
    isPhysical: body.isPhysical ?? !body.isEmulator,
    isWireless: body.isWireless ?? false,
    architecture: body.architecture,
    resolution: body.resolution,
    batteryLevel: body.batteryLevel,
    capabilities: body.capabilities ?? ["hot-reload"],
    isBooted: true,
  };
  runtimeState.attachDevice(device);
  return NextResponse.json({ data: device });
}
