import { NextRequest, NextResponse } from "next/server";
import { startStream } from "@/features/visual-runtime/screen-stream";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const stream = startStream(body.deviceId ?? "emulator-5554");
  return NextResponse.json({ data: stream });
}
