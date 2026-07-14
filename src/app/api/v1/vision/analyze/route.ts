import { NextRequest, NextResponse } from "next/server";
import { visionState } from "@/features/vision-ai/state";
import { enhanceWithAI } from "@/features/vision-ai/ai-analysis";
import { visualState } from "@/features/visual-runtime/state";
import type { VisionInput } from "@/features/vision-ai/types";

/**
 * POST /api/v1/vision/analyze
 *
 * Run the Vision AI analysis pipeline. Pulls real data from the Visual
 * Runtime state (screenshots, widget tree, performance, layout) and
 * enhances the report with an AI-generated executive summary.
 *
 * Body (all optional — defaults pulled from visual runtime):
 *   { deviceId, screenshot, widgetTree, renderTree, layoutReport, console, performance, useAI }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const deviceId = body.deviceId ?? "emulator-5554";

  // Pull real data from visual runtime state.
  const visualDevice = visualState.getDevice(deviceId);
  const screenshot = visualState.listScreenshots(deviceId)[0];
  const widgetTree = visualState.getLastWidgetTree();
  const renderTree = visualState.captureRenderTree();
  const layoutReport = visualState.analyzeLayout();
  const consoleEntries = visualState.listConsoleEntries({ level: "error" });
  const latestFrame = visualState.getLatestFrameStats();

  const input: VisionInput = {
    deviceId,
    screenshot: body.screenshot ?? (screenshot
      ? { width: screenshot.width, height: screenshot.height, orientation: screenshot.orientation }
      : visualDevice
        ? { width: parseInt(visualDevice.resolution.split("x")[0]), height: parseInt(visualDevice.resolution.split("x")[1]), orientation: visualDevice.orientation }
        : { width: 1080, height: 2400, orientation: "portrait" }),
    widgetTree: body.widgetTree ?? (widgetTree
      ? { totalNodes: widgetTree.totalNodes, maxDepth: widgetTree.maxDepth }
      : { totalNodes: 8, maxDepth: 4 }),
    renderTree: body.renderTree ?? {
      totalNodes: renderTree.totalNodes,
      totalLayoutTimeMs: renderTree.totalLayoutTimeMs,
      totalPaintTimeMs: renderTree.totalPaintTimeMs,
    },
    layoutReport: body.layoutReport ?? {
      issueCount: layoutReport.issueCount,
      totalWidgets: layoutReport.totalWidgets,
    },
    console: body.console ?? {
      errorCount: consoleEntries.length,
      warningCount: visualState.listConsoleEntries({ level: "warning" }).length,
    },
    performance: body.performance ?? (latestFrame
      ? { fps: latestFrame.fps, jankCount: latestFrame.jankCount, memoryMb: visualState.capturePerformanceOverlay().memoryMb, frameTimeMs: latestFrame.avgFrameDurationMs }
      : { fps: 60, jankCount: 0, memoryMb: 150, frameTimeMs: 16.6 }),
  };

  // Run heuristic analysis.
  let report = visionState.analyze(input);

  // Enhance with AI if requested (default: true).
  if (body.useAI !== false) {
    report = await enhanceWithAI(report);
    // Re-persist the enhanced report.
    visionState.reports[0] = report;
  }

  return NextResponse.json({ data: report });
}

/**
 * GET /api/v1/vision/analyze
 *
 * Returns the most recent analysis report (or 404 if none).
 */
export async function GET() {
  const report = visionState.listReports(1)[0];
  if (!report) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No analysis yet — POST to run one." } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: report });
}
