import { NextResponse } from "next/server";
import { listSessions } from "@/features/planner/sessions";

/**
 * GET /api/v1/planner/sessions
 *
 * Returns all planning sessions.
 */
export async function GET() {
  const sessions = listSessions().map((s) => ({
    ...s,
    plan: s.plan
      ? {
          ...s.plan,
          graph: { ...s.plan.graph, tasks: Array.from(s.plan.graph.tasks.values()) },
        }
      : undefined,
  }));
  return NextResponse.json({ data: sessions, total: sessions.length });
}
