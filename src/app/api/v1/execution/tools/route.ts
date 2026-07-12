import { NextResponse } from "next/server";
import { listTools } from "@/features/execution/registry";
import { telemetry } from "@/features/execution/telemetry";

/**
 * GET /api/v1/execution/tools
 *
 * Lists all registered tools with their descriptors + telemetry.
 */
export async function GET() {
  const tools = listTools();
  const enriched = tools.map((t) => ({
    ...t,
    telemetry: telemetry.getToolTelemetry(t.id),
  }));
  return NextResponse.json({ data: enriched, total: tools.length });
}
