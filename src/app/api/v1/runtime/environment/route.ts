import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/environment
 *
 * Returns the (simulated) environment info — OS, Java, Android SDK, Chrome,
 * Git, PATH entries, environment variables.
 */
export async function GET() {
  return NextResponse.json({ data: runtimeState.environment });
}
