import { NextRequest, NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";
import type { JobType, RuntimeType } from "@/features/cloud/types";

/**
 * GET /api/v1/cloud/jobs
 *
 * Process the queue (assign jobs to idle workers + execute) and return
 * the current queue + recently completed jobs.
 */
export async function GET() {
  await cloudState.processQueue();
  return NextResponse.json({
    data: { queue: cloudState.getQueue(), completed: cloudState.getCompleted(20) },
  });
}

/**
 * POST /api/v1/cloud/jobs
 *
 * Enqueue a new job. Body: { type, command, args, priority, runtimeType, projectId }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const job = cloudState.enqueueJob({
    type: (body.type ?? "custom") as JobType,
    command: body.command ?? "flutter",
    args: body.args ?? [],
    priority: body.priority ?? 0,
    runtimeType: (body.runtimeType ?? "local") as RuntimeType,
    projectId: body.projectId,
  });
  await cloudState.processQueue();
  return NextResponse.json({ data: job });
}
