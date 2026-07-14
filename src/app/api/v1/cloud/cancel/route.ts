import { NextRequest, NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * POST /api/v1/cloud/cancel
 *
 * Cancel a queued job.
 * Body: { jobId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { jobId } = body;
  if (!jobId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "jobId is required" } },
      { status: 400 }
    );
  }
  const success = cloudState.cancelJob(jobId);
  return NextResponse.json({ data: { success, jobId } });
}
