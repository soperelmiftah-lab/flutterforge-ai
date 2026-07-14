import { NextRequest, NextResponse } from "next/server";
import { queueBuild } from "@/features/cloud/builder";
import { processQueue } from "@/features/cloud/scheduler";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const build = queueBuild({ target: body.target ?? "apk", mode: body.mode ?? "debug", flavor: body.flavor, parallel: body.parallel ?? true });
  await processQueue();
  return NextResponse.json({ data: build });
}
