import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/logs
 *
 * Returns cloud platform logs (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.listLogs(100) });
}

/**
 * DELETE /api/v1/cloud/logs
 *
 * Clears all cloud logs.
 */
export async function DELETE() {
  cloudState.clearLogs();
  return new NextResponse(null, { status: 204 });
}
