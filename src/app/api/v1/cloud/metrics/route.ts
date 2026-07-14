import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/cloud/metrics";
import { getSnapshot } from "@/features/cloud/monitoring";

export async function GET() {
  return NextResponse.json({ data: { metrics: computeMetrics(), monitoring: getSnapshot() } });
}
