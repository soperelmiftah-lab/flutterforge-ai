import { NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";

/**
 * GET /api/v1/autonomous/sessions
 *
 * Returns all autonomous engineering sessions (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: autonomousState.listSessions() });
}
