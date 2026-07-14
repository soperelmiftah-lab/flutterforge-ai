import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/widget-tree
 *
 * Captures (or returns cached) the live widget tree of the running app.
 */
export async function GET() {
  const tree = visualState.captureWidgetTree();
  return NextResponse.json({ data: tree });
}
