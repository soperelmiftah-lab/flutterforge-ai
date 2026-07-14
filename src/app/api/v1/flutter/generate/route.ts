import { NextRequest, NextResponse } from "next/server";
import { generateDartCode, type GenerationMode } from "@/features/flutter-platform/generator";

/**
 * POST /api/v1/flutter/generate
 *
 * Generate Dart/Flutter code from a natural-language description.
 * Body: { description: string, mode?: "screen" | "widget" | "model" | "service", className?: string }
 *
 * Response: { data: GenerationResult }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { description, mode, className } = body;

  if (!description?.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "description is required" } },
      { status: 400 }
    );
  }

  const validModes: GenerationMode[] = ["screen", "widget", "model", "service"];
  const m: GenerationMode = validModes.includes(mode) ? mode : "screen";

  try {
    const result = await generateDartCode(description, m, { className });
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "GENERATE_FAILED",
          message: e instanceof Error ? e.message : "Generation failed",
        },
      },
      { status: 500 }
    );
  }
}
