import { NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";

/**
 * GET /api/v1/autonomous/history
 *
 * Returns autonomous engineering history (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: autonomousState.listHistory(20) });
}
