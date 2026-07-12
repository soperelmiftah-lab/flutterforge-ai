import { NextRequest, NextResponse } from "next/server";
import { scanner } from "@/features/workspace-intelligence/scanner";
import { buildIndex } from "@/features/workspace-intelligence/indexer";
import { buildGraph } from "@/features/workspace-intelligence/graph";
import { search } from "@/features/workspace-intelligence/search";
import type { SearchQuery } from "@/features/workspace-intelligence/types";

// Cache the index + graph per server instance (rebuilt on first search request).
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
 * POST /api/v1/workspace/search
 *
 * Semantic search across the project index.
 * Body: SearchQuery { query, kinds?, extensions?, limit?, includeComments? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as SearchQuery;
    if (!body.query?.trim()) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "query is required" } },
        { status: 400 }
      );
    }

    const { index, graph } = await ensureIndex();
    const results = search(index.files, graph, {
      query: body.query,
      kinds: body.kinds,
      extensions: body.extensions,
      limit: body.limit ?? 50,
      includeComments: body.includeComments ?? true,
    });

    return NextResponse.json({ data: results, total: results.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "SEARCH_FAILED", message: e instanceof Error ? e.message : "Search failed" } },
      { status: 500 }
    );
  }
}
