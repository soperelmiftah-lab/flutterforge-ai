import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/features/visual-runtime/device-bridge";
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const result = connect(body.deviceId ?? "emulator-5554");
  if (!result) return NextResponse.json({ error: { code: "CONNECT_FAILED", message: "Connection failed" } }, { status: 500 });
  return NextResponse.json({ data: result });
}
