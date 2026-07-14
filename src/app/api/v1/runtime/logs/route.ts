import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/logs
 *
 * Returns the runtime log buffer (newest first). Supports filtering by:
 *   ?level=info|warning|error|... — filter by log level
 *   ?source=flutter|dart|gradle|... — filter by source
 *   ?sessionId=<id>                — return logs for a specific run session
 *   ?limit=<n>                     — max number of entries (default 200)
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const level = url.searchParams.get("level") as any;
  const source = url.searchParams.get("source") ?? undefined;
  const sessionId = url.searchParams.get("sessionId") ?? undefined;
  const limit = url.searchParams.get("limit")
    ? parseInt(url.searchParams.get("limit")!, 10)
    : 200;
  const logs = runtimeState.listLogs({ level, source, sessionId, limit });
  return NextResponse.json({ data: logs, stats: runtimeState.logStats() });
}

/**
 * DELETE /api/v1/runtime/logs
 *
 * Clears the log buffer.
 */
export async function DELETE() {
  runtimeState.clearLogs();
  return new NextResponse(null, { status: 204 });
}
