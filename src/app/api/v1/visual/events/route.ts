import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";
import type { EventType } from "@/features/visual-runtime/types";

/**
 * GET /api/v1/visual/events
 *
 * Returns visual events (tap, scroll, navigation, lifecycle, etc.).
 * Filter by ?type=tap|scroll|navigation|...
 */
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as EventType | null;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10);
  const events = visualState.listEvents(type ?? undefined, limit);
  return NextResponse.json({ data: events, total: events.length });
}

/**
 * DELETE /api/v1/visual/events
 *
 * Clears all events.
 */
export async function DELETE() {
  visualState.clearEvents();
  return new NextResponse(null, { status: 204 });
}
