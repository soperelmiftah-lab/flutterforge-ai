import { NextRequest, NextResponse } from "next/server";
import { disconnect } from "@/features/visual-runtime/device-bridge";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const success = disconnect(body.deviceId ?? "emulator-5554");
  return NextResponse.json({ data: { success } });
}
