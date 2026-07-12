import { NextRequest, NextResponse } from "next/server";
import { fetchAllModels, fetchProviderModels, filterModels, sortModels } from "@/features/ai/models/registry";
import type { ProviderId } from "@/features/ai/provider/types";

/**
 * GET /api/v1/ai/models
 *
 * Returns the dynamic model registry. Aggregates models from all implemented
 * providers (OpenRouter + Forge in Phase 2). Supports filtering by provider,
 * free-only, and search.
 *
 * Query params:
 *   provider   — filter to a single provider
 *   freeOnly   — "true" to return only free models (default: false)
 *   q          — search query (matches id or name)
 *   sort       — "popularity" | "name" | "contextLength" | "cost"
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const provider = sp.get("provider") as ProviderId | null;
  const freeOnly = sp.get("freeOnly") === "true";
  const query = sp.get("q") ?? undefined;
  const sort = (sp.get("sort") ?? "popularity") as "popularity" | "name" | "contextLength" | "cost";

  try {
    let models;
    if (provider) {
      models = await fetchProviderModels(provider);
    } else {
      models = await fetchAllModels();
    }

    const filtered = filterModels(models, { freeOnly, query, provider: provider ?? undefined });
    const sorted = sortModels(filtered, sort);

    return NextResponse.json({ data: sorted, total: sorted.length });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "UNKNOWN", message: e instanceof Error ? e.message : "Failed to fetch models" } },
      { status: 500 }
    );
  }
}
