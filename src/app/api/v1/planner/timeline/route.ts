import { NextResponse } from "next/server";
import { getTimeline, timelineStats } from "@/features/planner/timeline";

/**
 * GET /api/v1/planner/timeline
 *
 * Returns recent timeline events.
 */
export async function GET() {
  const events = getTimeline(100);
  const stats = timelineStats();
  return NextResponse.json({ data: events, stats, total: events.length });
}
