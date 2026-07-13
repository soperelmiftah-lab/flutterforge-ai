import { NextResponse } from "next/server";
import { listSessions } from "@/features/planner/sessions";

/**
 * GET /api/v1/planner/tasks
 *
 * Returns tasks from the most recent plan.
 */
export async function GET() {
  const sessions = listSessions();
  const session = sessions.find((s) => s.plan);
  const tasks = session?.plan?.tasks ?? [];
  return NextResponse.json({ data: tasks, total: tasks.length });
}
