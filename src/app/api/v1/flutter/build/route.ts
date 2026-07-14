import { NextResponse } from "next/server";
import { checkBuildReadiness } from "@/features/flutter-platform/build";

/**
 * GET /api/v1/flutter/build
 *
 * Returns build-readiness checks for the workspace (operates on the
 * virtual filesystem via the Execution Engine's VFS).
 */
export async function GET() {
  try {
    const readiness = checkBuildReadiness(".");
    return NextResponse.json({ data: readiness });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "BUILD_CHECK_FAILED",
          message: e instanceof Error ? e.message : "Build check failed",
        },
      },
      { status: 500 }
    );
  }
}
