import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * POST /api/v1/cloud/test
 *
 * Submit a test job.
 */
export async function POST() {
  const job = cloudState.enqueueJob({
    type: "test",
    command: "flutter",
    args: ["test"],
    runtimeType: "local",
  });
  await cloudState.processQueue();
  return NextResponse.json({ data: job });
}
