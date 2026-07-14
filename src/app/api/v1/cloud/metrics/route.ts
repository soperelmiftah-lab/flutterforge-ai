import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/metrics
 *
 * Returns aggregated cloud metrics + monitoring snapshot.
 */
export async function GET() {
  return NextResponse.json({
    data: { metrics: cloudState.computeMetrics(), monitoring: cloudState.getSnapshot() },
  });
}
