import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import type { BuildConfig, BuildTarget, BuildMode } from "@/features/flutter-runtime/types";

/**
 * POST /api/v1/runtime/build
 *
 * Queue and run a build job. The job runs synchronously (with simulated
 * progress steps) and returns the final state.
 *
 * Body: { target?: BuildTarget, mode?: BuildMode, flavor?: string, args?: string[] }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const target = (body.target ?? "apk") as BuildTarget;
  const mode = (body.mode ?? "debug") as BuildMode;
  const flavor = body.flavor as string | undefined;
  const args = Array.isArray(body.args) ? body.args : [];

  const config: BuildConfig = { target, mode, flavor, args };
  const job = runtimeState.queueBuild(config);
  const finished = await runtimeState.runBuild(job.id);
  return NextResponse.json({ data: finished });
}

/**
 * GET /api/v1/runtime/build
 *
 * List all build jobs (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.listBuildJobs() });
}
