import { NextRequest, NextResponse } from "next/server";
import { scanner } from "@/features/workspace-intelligence/scanner";
import { buildIndex } from "@/features/workspace-intelligence/indexer";
import type { WorkspacePath, WorkspaceFile } from "@/features/workspace-intelligence/types";

let cachedIndex: Awaited<ReturnType<typeof buildIndex>> | null = null;

async function ensureIndex() {
  if (!cachedIndex) {
    const scan = await scanner.scan(".");
    cachedIndex = await buildIndex(scan);
  }
  return cachedIndex;
}

/**
 * GET /api/v1/workspace/files
 *
 * List indexed files, optionally filtered by extension or path prefix.
 * Query params:
 *   ext     — filter by extension (e.g. "dart")
 *   prefix  — filter by path prefix (e.g. "lib/")
 *   symbols — "true" to include symbols in the response
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const ext = sp.get("ext");
    const prefix = sp.get("prefix");
    const includeSymbols = sp.get("symbols") === "true";

    const index = await ensureIndex();
    let files: WorkspaceFile[] = index.files;

    if (ext) files = files.filter((f) => f.extension === ext);
    if (prefix) files = files.filter((f) => f.path.startsWith(prefix));
    if (!includeSymbols) {
      files = files.map((f) => ({ ...f, symbols: [] }));
    }

    return NextResponse.json({ data: files, total: files.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "FILES_FAILED", message: e instanceof Error ? e.message : "Failed to list files" } },
      { status: 500 }
    );
  }
}

export type { WorkspacePath };
