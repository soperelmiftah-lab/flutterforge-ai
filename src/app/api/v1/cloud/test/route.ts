import { NextRequest, NextResponse } from "next/server";
import { submitTest } from "@/features/cloud/jobs";
import { processQueue } from "@/features/cloud/scheduler";

export async function POST(req: NextRequest) {
  const job = submitTest();
  await processQueue();
  return NextResponse.json({ data: job });
}
