import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/hotrestart
 *
 * Trigger a hot restart on the active session (or a specific session via
 * ?sessionId=).
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") ?? undefined;
  const result = runtimeState.hotRestart(sessionId);
  return NextResponse.json({ data: result });
}
