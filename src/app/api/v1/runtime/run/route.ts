import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import type { RunConfig } from "@/features/flutter-runtime/types";

/**
 * POST /api/v1/runtime/run
 *
 * Start a Flutter app run session on a device. The session persists in
 * memory — logs accumulate, hot reload/restart actually update the counter.
 *
 * Body: { deviceId: string, target?: string, flavor?: string, args?: string[], environment?: Record<string,string> }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = body.deviceId ?? "chrome-1";
  const device = runtimeState.getDevice(deviceId);
  if (!device) {
    return NextResponse.json(
      { error: { code: "DEVICE_NOT_FOUND", message: `Device not found: ${deviceId}` } },
      { status: 404 }
    );
  }
  if (!device.isBooted) {
    return NextResponse.json(
      { error: { code: "DEVICE_NOT_BOOTED", message: `Device not booted: ${device.name}` } },
      { status: 400 }
    );
  }
  const config: RunConfig = {
    deviceId,
    target: body.target,
    flavor: body.flavor,
    args: Array.isArray(body.args) ? body.args : [],
    environment: body.environment ?? {},
  };
  const session = runtimeState.startSession("proj_current", config);
  // Wait briefly for the session to transition to "running".
  await new Promise((resolve) => setTimeout(resolve, 250));
  return NextResponse.json({ data: runtimeState.getSession(session.id) });
}

/**
 * GET /api/v1/runtime/run
 *
 * List all run sessions (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.listSessions() });
}
