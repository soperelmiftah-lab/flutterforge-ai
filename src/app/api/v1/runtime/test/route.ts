import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import type { TestType } from "@/features/flutter-runtime/types";

/**
 * POST /api/v1/runtime/test
 *
 * Runs `flutter test` (simulated). Returns pass/fail/skip counts and
 * coverage.
 *
 * Body: { type?: "unit" | "widget" | "integration" | "golden" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const type = (body.type ?? "unit") as TestType;
  const result = runtimeState.runTest(type);
  return NextResponse.json({ data: result });
}
