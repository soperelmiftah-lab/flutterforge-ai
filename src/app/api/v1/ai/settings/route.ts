import { NextRequest, NextResponse } from "next/server";
import { defaultAISettings } from "@/features/ai/settings/types";
import type { AISettings } from "@/features/ai/settings/types";

/**
 * GET  /api/v1/ai/settings — return default AI settings (server-side defaults)
 * PUT  /api/v1/ai/settings — accept updated settings (persisted client-side in Phase 2;
 *                            server persistence arrives with auth in a future phase)
 */
export async function GET() {
  return NextResponse.json({ data: defaultAISettings });
}

export async function PUT(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as Partial<AISettings>;
  const merged: AISettings = { ...defaultAISettings, ...body };
  // Phase 2: settings persist client-side via Zustand. Server persistence
  // arrives with the auth layer (AiSetting table is ready in the schema).
  return NextResponse.json({ data: merged });
}
