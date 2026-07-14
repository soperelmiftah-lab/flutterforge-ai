import { NextRequest, NextResponse } from "next/server";
import { analyze } from "@/features/vision-ai/reports";
import { recordReport } from "@/features/vision-ai/metrics";
import { recordHistory } from "@/features/vision-ai/history";
import type { VisionInput } from "@/features/vision-ai/types";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input: VisionInput = {
    deviceId: body.deviceId ?? "emulator-5554",
    screenshot: body.screenshot ?? { width: 1080, height: 2400, orientation: "portrait" },
    widgetTree: body.widgetTree ?? { totalNodes: 8, maxDepth: 4 },
    renderTree: body.renderTree ?? { totalNodes: 5, totalLayoutTimeMs: 1.6, totalPaintTimeMs: 0.8 },
    layoutReport: body.layoutReport ?? { issueCount: 1, totalWidgets: 12 },
    console: body.console ?? { errorCount: 1, warningCount: 1 },
    performance: body.performance ?? { fps: 58, jankCount: 2, memoryMb: 180, frameTimeMs: 17.2 },
  };
  const report = analyze(input);
  recordReport(report);
  recordHistory({ reportId: report.id, deviceId: input.deviceId, overallScore: report.overallScore, confidence: report.confidence.score, issueCount: report.issues.length });
  return NextResponse.json({ data: report });
}
