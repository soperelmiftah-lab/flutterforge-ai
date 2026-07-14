import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/tool-intelligence/metrics";
import { listChains } from "@/features/tool-intelligence/state";

/**
 * GET /api/v1/tools/metrics
 *
 * Returns Tool Intelligence metrics (chain count, average length, retry count,
 * simulation accuracy, failure rate, recovery rate, optimization score,
 * per-tool usage).
 */
export async function GET() {
  const chains = listChains();
  const metrics = computeMetrics(chains);
  return NextResponse.json({ data: metrics });
}
