import { NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";

/**
 * GET /api/v1/vision/reports
 *
 * Returns all analysis reports (newest first).
 */
export async function GET() {
  const reports = visionState.listReports(20);
  return NextResponse.json({ data: reports, total: reports.length });
}
