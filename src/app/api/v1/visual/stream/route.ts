import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/stream
 *   ?deviceId=<id>     → get the active stream for a device
 *   (no params)        → list all streams
 *
 * POST /api/v1/visual/stream
 *   Body: { deviceId: string, action: "start" | "stop" | "pause" | "resume" }
 */
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? undefined;
  if (deviceId) {
    return NextResponse.json({ data: visualState.getActiveStream(deviceId) });
  }
  return NextResponse.json({ data: visualState.listStreams(), total: visualState.listStreams().length });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { deviceId, action } = body;
  if (!deviceId || !action) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "deviceId and action are required" } },
      { status: 400 }
    );
  }
  switch (action) {
    case "start": {
      const stream = visualState.startStream(deviceId);
      if (!stream) return NextResponse.json({ error: { code: "STREAM_FAILED", message: "Device not connected" } }, { status: 400 });
      return NextResponse.json({ data: stream });
    }
    case "stop":
      return NextResponse.json({ data: { success: visualState.stopStream(deviceId) } });
    case "pause":
      return NextResponse.json({ data: { success: visualState.pauseStream(deviceId) } });
    case "resume":
      return NextResponse.json({ data: { success: visualState.resumeStream(deviceId) } });
    default:
      return NextResponse.json({ error: { code: "INVALID_ACTION", message: `Unknown action: ${action}` } }, { status: 400 });
  }
}
