import { NextResponse } from "next/server";
import { flutterTemplates, listTemplates, templateCategories } from "@/features/flutter-platform/templates";

/**
 * GET /api/v1/flutter/templates
 *
 * Returns all Flutter templates, optionally filtered by ?category=.
 * Each template includes its full file set (real Dart code).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;

  const templates = category ? listTemplates(category) : flutterTemplates;
  return NextResponse.json({
    data: templates,
    total: templates.length,
    categories: templateCategories(),
  });
}
