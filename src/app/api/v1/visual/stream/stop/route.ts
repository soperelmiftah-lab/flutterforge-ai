import { NextRequest, NextResponse } from "next/server";
import { stopStream } from "@/features/visual-runtime/screen-stream";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const success = stopStream(body.deviceId ?? "emulator-5554");
  return NextResponse.json({ data: { success } });
}
