import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/hotreload
 *
 * Trigger a hot reload on the active session (or a specific session via
 * ?sessionId=). Returns the result with duration in ms.
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId") ?? undefined;
  const result = runtimeState.hotReload(sessionId);
  return NextResponse.json({ data: result });
}
