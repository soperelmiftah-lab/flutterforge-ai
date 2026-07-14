import { NextRequest, NextResponse } from "next/server";
import { submitRun } from "@/features/cloud/jobs";
import { processQueue } from "@/features/cloud/scheduler";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const job = submitRun(body.deviceId ?? "emulator-5554", body.runtimeType ?? "local");
  await processQueue();
  return NextResponse.json({ data: job });
}
