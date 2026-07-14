import { NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";

/**
 * GET /api/v1/vision/sessions
 *
 * Returns all Vision AI analysis sessions (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: visionState.listSessions() });
}
