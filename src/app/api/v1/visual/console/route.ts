import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";
import type { ConsoleLevel, ConsoleSource } from "@/features/visual-runtime/types";

/**
 * GET /api/v1/visual/console
 *
 * Returns console entries. Filter by ?level=, ?source=, ?q=, ?limit=.
 */
export async function GET(req: NextRequest) {
  const level = req.nextUrl.searchParams.get("level") as ConsoleLevel | null;
  const source = req.nextUrl.searchParams.get("source") as ConsoleSource | null;
  const query = req.nextUrl.searchParams.get("q") ?? undefined;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "100", 10);
  const entries = visualState.listConsoleEntries({ level: level ?? undefined, source: source ?? undefined, query, limit });
  return NextResponse.json({ data: entries, stats: visualState.consoleStats() });
}

/**
 * DELETE /api/v1/visual/console
 *
 * Clears all console entries.
 */
export async function DELETE() {
  visualState.clearConsole();
  return new NextResponse(null, { status: 204 });
}
