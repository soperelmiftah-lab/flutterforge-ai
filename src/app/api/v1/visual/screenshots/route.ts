import { NextRequest, NextResponse } from "next/server";
import { getScreenshots } from "@/features/visual-runtime/screenshots";
export async function GET(req: NextRequest) {
  const deviceId = req.nextUrl.searchParams.get("deviceId") ?? undefined;
  const screenshots = getScreenshots(deviceId);
  return NextResponse.json({ data: screenshots, total: screenshots.length });
}
