import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/vision-ai/metrics";

export async function GET() {
  return NextResponse.json({ data: computeMetrics() });
}
