import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/stop
 *
 * Stop a run session.
 * Body: { sessionId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { sessionId } = body;
  if (!sessionId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "sessionId is required" } },
      { status: 400 }
    );
  }
  const ok = runtimeState.stopSession(sessionId);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Session not found: ${sessionId}` } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: { stopped: true, sessionId } });
}
