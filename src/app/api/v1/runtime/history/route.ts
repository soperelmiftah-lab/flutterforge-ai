import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/history
 *
 * Returns runtime history (newest first).
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.listHistory() });
}
