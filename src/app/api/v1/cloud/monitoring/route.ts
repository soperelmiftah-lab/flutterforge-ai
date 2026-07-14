import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/monitoring
 *
 * Returns a live monitoring snapshot (worker health, queue depth, success rate).
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.getSnapshot() });
}
