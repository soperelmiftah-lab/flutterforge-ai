import { NextRequest, NextResponse } from "next/server";
import { scanner } from "@/features/workspace-intelligence/scanner";
import { buildIndex } from "@/features/workspace-intelligence/indexer";
import { buildGraph } from "@/features/workspace-intelligence/graph";
import { assembleContext } from "@/features/workspace-intelligence/context";
import type { ContextRequest } from "@/features/workspace-intelligence/context";

let cachedIndex: Awaited<ReturnType<typeof buildIndex>> | null = null;
let cachedGraph: ReturnType<typeof buildGraph> | null = null;

async function ensureIndex() {
  if (!cachedIndex) {
    const scan = await scanner.scan(".");
    cachedIndex = await buildIndex(scan);
    cachedGraph = buildGraph(cachedIndex.files);
  }
  return { index: cachedIndex, graph: cachedGraph };
}

/**
 * POST /api/v1/workspace/context
 *
 * Assemble AI context for a user request. Returns ranked files that fit
 * the model's context window, with token estimates.
 * Body: ContextRequest { query, topN?, currentFile?, pinnedFiles?, contextLength, reservedTokens? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<ContextRequest> & { query?: string };
    if (!body.query?.trim() && !body.currentFile && !body.pinnedFiles?.length) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "query, currentFile, or pinnedFiles is required" } },
        { status: 400 }
      );
    }
    if (!body.contextLength) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "contextLength is required" } },
        { status: 400 }
      );
    }

    const { index, graph } = await ensureIndex();
    const result = assembleContext(index.files, graph, {
      query: body.query ?? "",
      topN: body.topN ?? 10,
      currentFile: body.currentFile,
      pinnedFiles: body.pinnedFiles,
      contextLength: body.contextLength,
      reservedTokens: body.reservedTokens,
    });

    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "CONTEXT_FAILED", message: e instanceof Error ? e.message : "Context assembly failed" } },
      { status: 500 }
    );
  }
}
