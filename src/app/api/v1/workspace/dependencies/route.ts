import { NextRequest, NextResponse } from "next/server";
import { scanner } from "@/features/workspace-intelligence/scanner";
import { buildIndex } from "@/features/workspace-intelligence/indexer";
import { buildGraph } from "@/features/workspace-intelligence/graph";
import type { DependencyEdge } from "@/features/workspace-intelligence/types";

let cachedIndex: Awaited<ReturnType<typeof buildIndex>> | null = null;
let cachedGraph: ReturnType<typeof buildGraph> | null = null;

async function ensureGraph() {
  if (!cachedIndex || !cachedGraph) {
    const scan = await scanner.scan(".");
    cachedIndex = await buildIndex(scan);
    cachedGraph = buildGraph(cachedIndex.files);
  }
  return cachedGraph;
}

/**
 * GET /api/v1/workspace/dependencies
 *
 * Returns the dependency graph (nodes + edges). Optionally filter edges
 * by `from` or `to` path.
 * Query params:
 *   from — only edges originating from this path
 *   to   — only edges pointing to this path
 *   kind — only edges of this kind (import, widget-usage, etc.)
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const kind = sp.get("kind");

    const graph = await ensureGraph();
    let edges: DependencyEdge[] = graph.edges;

    if (from) edges = edges.filter((e) => e.from === from);
    if (to) edges = edges.filter((e) => e.to === to);
    if (kind) edges = edges.filter((e) => e.kind === kind);

    const nodes = Array.from(graph.nodes.entries()).map(([path, node]) => ({
      path,
      inDegree: node.inDegree,
      outDegree: node.outDegree,
      importance: node.importance,
    }));

    return NextResponse.json({ data: { nodes, edges } });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "GRAPH_FAILED", message: e instanceof Error ? e.message : "Failed to build graph" } },
      { status: 500 }
    );
  }
}
