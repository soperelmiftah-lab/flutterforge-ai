import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/doctor
 *
 * Runs a (simulated) `flutter doctor` — checks SDK, Dart, Android SDK, Java,
 * Chrome, devices, Git. Returns per-check status + overall status.
 */
export async function GET() {
  const result = runtimeState.runDoctor();
  return NextResponse.json({ data: result });
}
