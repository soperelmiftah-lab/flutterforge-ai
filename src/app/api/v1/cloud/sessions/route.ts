import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/sessions
 *
 * Returns all cloud sessions.
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.listSessions() });
}
