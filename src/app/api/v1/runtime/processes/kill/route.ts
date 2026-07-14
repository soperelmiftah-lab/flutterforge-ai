import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/processes/kill
 * Body: { pid: number }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const pid = Number(body.pid);
  if (!pid) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "pid is required" } },
      { status: 400 }
    );
  }
  const ok = runtimeState.killProcess(pid);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Process not found: ${pid}` } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: { killed: true, pid } });
}
