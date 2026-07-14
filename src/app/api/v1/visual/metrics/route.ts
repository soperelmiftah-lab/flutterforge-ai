import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/metrics
 *
 * Returns aggregated visual runtime metrics.
 */
export async function GET() {
  const metrics = visualState.computeMetrics();
  return NextResponse.json({ data: metrics });
}
