import { NextResponse } from "next/server";
import { computeMetrics } from "@/features/visual-runtime/metrics";
export async function GET() {
  return NextResponse.json({ data: computeMetrics() });
}
