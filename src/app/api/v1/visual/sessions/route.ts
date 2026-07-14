import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/sessions
 *
 * Returns all visual sessions (newest first).
 */
export async function GET() {
  return NextResponse.json({
    data: visualState.listSessions(),
    active: visualState.listActiveSessions(),
    total: visualState.listSessions().length,
  });
}
