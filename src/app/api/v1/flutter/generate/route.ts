import { NextRequest, NextResponse } from "next/server";
import { generateDartCode, type GenerationMode } from "@/features/flutter-platform/generator";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * POST /api/v1/flutter/generate
 *
 * Generate Dart/Flutter code from a natural-language description.
 * Requires authentication. Persists the generated code to the database.
 *
 * Body: { description: string, mode?: "screen" | "widget" | "model" | "service", className?: string }
 *
 * Response: { data: GenerationResult & { id: string, saved: boolean } }
 */
export async function POST(req: NextRequest) {
  // 1. Require authentication
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  // 2. Validate input
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

  // 3. Generate code via AI
  try {
    const result = await generateDartCode(description, m, { className });

    // 4. Persist to database (Supabase PostgreSQL via Prisma)
    const saved = await db.generatedCode.create({
      data: {
        userId: user.id,
        description: result.description,
        mode: result.mode,
        className: result.className,
        code: result.code,
        suggestedPath: result.suggestedPath,
        lineCount: result.lineCount,
        rationale: result.rationale,
        aiGenerated: result.aiGenerated,
        saved: false,
      },
    });

    return NextResponse.json({
      data: { ...result, id: saved.id, saved: false },
    });
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

/**
 * GET /api/v1/flutter/generate
 *
 * Returns the user's previously generated code snippets.
 * Requires authentication.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
      { status: 401 }
    );
  }

  const snippets = await db.generatedCode.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: snippets, total: snippets.length });
}
