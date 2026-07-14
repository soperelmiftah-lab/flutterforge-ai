import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/layout
 *
 * Analyzes the current layout for overflow, alignment, spacing issues.
 */
export async function GET() {
  const report = visualState.analyzeLayout();
  return NextResponse.json({ data: report });
}
