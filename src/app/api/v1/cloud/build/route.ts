import { NextRequest, NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";
import type { BuildTarget, BuildMode } from "@/features/cloud/types";

/**
 * POST /api/v1/cloud/build
 *
 * Queue a new build. Body: { target, mode, flavor, parallel }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const build = cloudState.queueBuild({
    target: (body.target ?? "apk") as BuildTarget,
    mode: (body.mode ?? "debug") as BuildMode,
    flavor: body.flavor,
    parallel: body.parallel ?? true,
  });
  await cloudState.processQueue();
  return NextResponse.json({ data: build });
}

/**
 * GET /api/v1/cloud/build
 *
 * Returns all build farm jobs.
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.listBuilds(), active: cloudState.getActiveBuilds().length });
}
