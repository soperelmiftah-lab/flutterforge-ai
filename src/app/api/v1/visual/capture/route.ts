import { NextRequest, NextResponse } from "next/server";
import { captureScreenshot } from "@/features/visual-runtime/screenshots";
import { getDevice } from "@/features/visual-runtime/adb";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const device = getDevice(body.deviceId ?? "emulator-5554");
  const screenshot = captureScreenshot(body.deviceId ?? "emulator-5554", device ? { resolution: device.resolution, orientation: device.orientation } : undefined);
  return NextResponse.json({ data: screenshot });
}
