import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/render-tree
 *
 * Captures the render tree with layout/paint times per node.
 */
export async function GET() {
  const tree = visualState.captureRenderTree();
  return NextResponse.json({ data: tree });
}
