import { NextRequest, NextResponse } from "next/server";
import { compareScreenshots } from "@/features/vision-ai/comparison";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (!body.screenshotA || !body.screenshotB) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "screenshotA and screenshotB are required" } }, { status: 400 });
  const result = compareScreenshots(body.screenshotA, body.screenshotB);
  return NextResponse.json({ data: result });
}
