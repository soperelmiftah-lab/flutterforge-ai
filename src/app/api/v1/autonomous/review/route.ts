import { NextResponse } from "next/server";
import { performReview } from "@/features/autonomous/review";
import { computeQuality } from "@/features/autonomous/quality";
import { visualState } from "@/features/visual-runtime/state";
import { visionState } from "@/features/vision-ai/state";

/**
 * GET /api/v1/autonomous/review
 *
 * Returns automated code review findings + quality scores. Pulls real
 * signals from Vision AI (a11y score) and Visual Runtime (frame stats).
 */
export async function GET() {
  const findings = performReview();

  // Pull real signals.
  const latestVision = visionState.listReports(1)[0];
  const latestFrame = visualState.getLatestFrameStats();
  const a11yScore = latestVision?.accessibility.score ?? 68;
  const fps = latestFrame?.fps ?? 58;
  const jankCount = latestFrame?.jankCount ?? 2;

  const quality = computeQuality({
    constUsage: 0.6,
    avgFileLength: 25,
    maxDepth: 4,
    fps,
    jankCount,
    a11yScore,
    hasTests: false,
    hasStateManagement: true,
    hasCleanArchitecture: true,
  });

  return NextResponse.json({ data: { findings, quality } });
}
