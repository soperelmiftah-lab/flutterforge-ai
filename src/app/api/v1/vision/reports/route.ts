import { NextResponse } from "next/server";
import { getReports } from "@/features/vision-ai/metrics";

export async function GET() {
  const reports = getReports(20);
  return NextResponse.json({ data: reports, total: reports.length });
}
