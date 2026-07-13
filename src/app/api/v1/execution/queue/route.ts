import { NextResponse } from "next/server";
import { executionQueue } from "@/features/execution/queue";

/**
 * GET /api/v1/execution/queue
 *
 * Returns the current queue state + stats.
 */
export async function GET() {
  const items = executionQueue.getItems();
  const stats = executionQueue.stats();
  return NextResponse.json({
    data: items,
    stats,
    mode: executionQueue.getMode(),
    paused: executionQueue.isPaused(),
  });
}
