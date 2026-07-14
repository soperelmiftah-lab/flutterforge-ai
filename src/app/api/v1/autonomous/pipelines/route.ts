import { NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";

/**
 * GET /api/v1/autonomous/pipelines
 *
 * Returns all engineering pipelines (newest first).
 */
export async function GET() {
  const pipelines = autonomousState.listPipelines();
  return NextResponse.json({ data: pipelines, total: pipelines.length });
}
