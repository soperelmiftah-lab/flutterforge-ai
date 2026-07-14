import { NextResponse } from "next/server";
import {
  getAllSummaries,
  getToolSummary,
  getMostReliableTools,
  clearLearning,
} from "@/features/tool-intelligence/learning";

/**
 * GET /api/v1/tools/learn
 *
 * Returns tool-learning summaries — success rate, average duration, average
 * tokens, common chains — for every tool that has been executed.
 *
 * Query params:
 *   - ?toolId=<id>      → return a single tool summary
 *   - ?top=true         → return the most reliable tools (top 5)
 *
 * Response: { data: ToolLearningSummary | ToolLearningSummary[] }
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const toolId = url.searchParams.get("toolId");
  const top = url.searchParams.get("top");

  if (toolId) {
    return NextResponse.json({ data: getToolSummary(toolId) });
  }

  if (top === "true") {
    return NextResponse.json({ data: getMostReliableTools(5) });
  }

  return NextResponse.json({ data: getAllSummaries() });
}

/**
 * DELETE /api/v1/tools/learn
 *
 * Clears all learning records. Useful for testing.
 */
export async function DELETE() {
  clearLearning();
  return new NextResponse(null, { status: 204 });
}
