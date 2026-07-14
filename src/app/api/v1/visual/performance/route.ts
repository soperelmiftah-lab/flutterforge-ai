import { NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * GET /api/v1/visual/performance
 *
 * Returns the latest performance overlay (raster, UI, GPU, memory).
 */
export async function GET() {
  const overlay = visualState.capturePerformanceOverlay();
  return NextResponse.json({ data: overlay });
}
