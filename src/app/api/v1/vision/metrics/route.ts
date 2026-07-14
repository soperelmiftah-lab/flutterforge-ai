import { NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";

/**
 * GET /api/v1/vision/metrics
 *
 * Returns aggregated Vision AI metrics computed from actual reports.
 */
export async function GET() {
  return NextResponse.json({ data: visionState.computeMetrics() });
}
