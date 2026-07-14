import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/sessions
 *
 * Returns all runtime sessions (run sessions + their build jobs + log count).
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.listRuntimeSessions() });
}
