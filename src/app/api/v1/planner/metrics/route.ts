import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/planner/metrics";

/**
 * GET /api/v1/planner/metrics
 *
 * Returns aggregated planner metrics.
 */
export async function GET() {
  const metrics = computeMetrics();
  return NextResponse.json({ data: metrics });
}
