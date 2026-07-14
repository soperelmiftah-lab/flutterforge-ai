import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";
import type { AnnotationType } from "@/features/visual-runtime/types";

/**
 * GET /api/v1/visual/annotations
 *   Returns all annotations.
 *
 * POST /api/v1/visual/annotations
 *   Body: { type: AnnotationType, rect: {x,y,width,height}, label: string, color?: string }
 *
 * DELETE /api/v1/visual/annotations
 *   Clears all annotations.
 */
export async function GET() {
  return NextResponse.json({ data: visualState.listAnnotations() });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type, rect, label, color } = body;
  if (!type || !rect || !label) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type, rect, and label are required" } },
      { status: 400 }
    );
  }
  const annotation = visualState.addAnnotation({
    type: type as AnnotationType,
    rect,
    label,
    color: color ?? "#f59e0b",
  });
  return NextResponse.json({ data: annotation });
}

export async function DELETE() {
  visualState.clearAnnotations();
  return new NextResponse(null, { status: 204 });
}
