import { NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * GET /api/v1/runtime/sdk
 *
 * Returns the (simulated) installed Flutter SDK.
 */
export async function GET() {
  return NextResponse.json({
    data: [runtimeState.sdk],
    current: runtimeState.sdk,
  });
}
