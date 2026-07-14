import { NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";

/**
 * GET /api/v1/autonomous/metrics
 *
 * Returns aggregated autonomous engineering metrics computed from real history.
 */
export async function GET() {
  return NextResponse.json({ data: autonomousState.computeMetrics() });
}
