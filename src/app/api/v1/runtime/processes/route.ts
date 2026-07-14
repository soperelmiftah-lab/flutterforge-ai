import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/processes
 *
 * Returns running processes (Flutter run sessions, build jobs, etc.).
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.listProcesses() });
}
