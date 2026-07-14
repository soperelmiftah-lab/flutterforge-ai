import { NextRequest, NextResponse } from "next/server";
import { runtimeState } from "@/features/flutter-runtime/state";
import type { PubCommand } from "@/features/flutter-runtime/types";

/**
 * POST /api/v1/runtime/pub
 *
 * Runs `flutter pub <command>` (simulated). Returns output + packages affected.
 *
 * Body: { command: "get" | "upgrade" | "downgrade" | "outdated" | "deps" | "cache-repair" }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const command = (body.command ?? "get") as PubCommand;
  const result = runtimeState.runPub(command);
  return NextResponse.json({ data: result });
}
