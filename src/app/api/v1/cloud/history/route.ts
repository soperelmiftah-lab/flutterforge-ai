import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/history
 *
 * Returns cloud execution history (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.listHistory(20) });
}
