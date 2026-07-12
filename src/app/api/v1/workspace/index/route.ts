import { NextResponse } from "next/server";
import { scanner } from "@/features/workspace-intelligence/scanner";
import { buildIndex } from "@/features/workspace-intelligence/indexer";

/**
 * GET /api/v1/workspace/index
 *
 * Scans the current project and returns the full structured index:
 * files (with symbols/imports/exports), folders, knowledge base, and statistics.
 */
export async function GET() {
  try {
    const scan = await scanner.scan(".");
    const index = await buildIndex(scan);
    return NextResponse.json({ data: index });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "INDEX_FAILED", message: e instanceof Error ? e.message : "Indexing failed" } },
      { status: 500 }
    );
  }
}
