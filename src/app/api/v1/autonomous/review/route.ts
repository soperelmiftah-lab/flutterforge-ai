import { NextResponse } from "next/server";
import { performReview } from "@/features/autonomous/review";
import { computeQuality } from "@/features/autonomous/quality";

export async function GET() {
  const findings = performReview();
  const quality = computeQuality({ constUsage: 0.6, avgFileLength: 25, maxDepth: 4, fps: 58, jankCount: 2, a11yScore: 68, hasTests: false, hasStateManagement: true, hasCleanArchitecture: true });
  return NextResponse.json({ data: { findings, quality } });
}
