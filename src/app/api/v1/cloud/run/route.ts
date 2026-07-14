import { NextRequest, NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * POST /api/v1/cloud/run
 *
 * Submit a run job. Body: { deviceId, runtimeType }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = body.deviceId ?? "emulator-5554";
  const job = cloudState.enqueueJob({
    type: "run",
    command: "flutter",
    args: ["run", "-d", deviceId],
    runtimeType: body.runtimeType ?? "local",
  });
  await cloudState.processQueue();
  return NextResponse.json({ data: job });
}
