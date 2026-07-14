import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/metrics
 *
 * Returns runtime metrics computed from the actual history (run count,
 * build count, average durations, hot reload count, etc.).
 */
export async function GET() {
  const metrics = runtimeState.computeMetrics();
  return NextResponse.json({ data: metrics });
}
