import { NextRequest, NextResponse } from "next/server";
import { enqueueJob, processQueue, getQueue, getCompleted } from "@/features/cloud/scheduler";
import type { JobType, RuntimeType } from "@/features/cloud/types";

export async function GET() {
  await processQueue();
  return NextResponse.json({ data: { queue: getQueue(), completed: getCompleted(20) } });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const job = enqueueJob({
    type: (body.type ?? "custom") as JobType,
    command: body.command ?? "flutter",
    args: body.args ?? [],
    priority: body.priority ?? 0,
    runtimeType: (body.runtimeType ?? "local") as RuntimeType,
    projectId: body.projectId,
  });
  await processQueue();
  return NextResponse.json({ data: job });
}
