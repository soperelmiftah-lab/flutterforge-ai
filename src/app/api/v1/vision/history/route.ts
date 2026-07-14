import { NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";

/**
 * GET /api/v1/vision/history
 *
 * Returns analysis history entries (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: visionState.listHistory(20) });
}
