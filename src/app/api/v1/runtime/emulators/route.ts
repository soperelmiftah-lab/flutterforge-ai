import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/emulators
 *
 * Returns the emulator registry.
 */
export async function GET() {
  const emus = runtimeState.listEmulators();
  return NextResponse.json({ data: emus, total: emus.length });
}
