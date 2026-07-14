import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";

/**
 * POST /api/v1/runtime/emulator/start
 * Body: { emulatorId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { emulatorId } = body;
  if (!emulatorId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "emulatorId is required" } },
      { status: 400 }
    );
  }
  const ok = runtimeState.startEmulator(emulatorId);
  if (!ok) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Emulator not found: ${emulatorId}` } },
      { status: 404 }
    );
  }
  return NextResponse.json({ data: { started: true, emulatorId } });
}
