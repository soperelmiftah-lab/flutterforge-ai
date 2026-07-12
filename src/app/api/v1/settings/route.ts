import { NextRequest, NextResponse } from "next/server";
import { defaultSettings } from "@/stores/settings-store";
import type { AppSettings } from "@/lib/types";

/**
 * /api/v1/settings
 * Mock settings endpoints. Phase 1 persists client-side via Zustand; this route
 * exists so the contract is in place for the future server-persisted settings
 * (Settings table) once auth lands.
 */
export async function GET() {
  return NextResponse.json({ data: defaultSettings });
}

export async function PUT(req: NextRequest) {
  const input = (await req.json().catch(() => ({}))) as Partial<AppSettings>;
  const merged: AppSettings = { ...defaultSettings, ...input };
  return NextResponse.json({ data: merged });
}
