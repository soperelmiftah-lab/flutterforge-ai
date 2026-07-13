import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/tool-intelligence/metrics";
import { chainStore } from "../analyze/route";

/**
 * GET /api/v1/tools/metrics
 *
 * Returns Tool Intelligence metrics.
 */
export async function GET() {
  const chains = Array.from(chainStore.values());
  const metrics = computeMetrics(chains);
  return NextResponse.json({ data: metrics });
}
