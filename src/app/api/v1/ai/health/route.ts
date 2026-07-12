import { NextRequest, NextResponse } from "next/server";
import { getProvider } from "@/features/ai/provider/registry";
import { getCredential } from "@/features/ai/registry/credentials";
import { allProviderMetas } from "@/features/ai/provider/registry";
import type { ProviderId, HealthStatus } from "@/features/ai/provider/types";

/**
 * GET /api/v1/ai/health
 *
 * Health check for AI providers. If ?provider=<id> is given, checks just
 * that provider (including credential validity). Otherwise returns the
 * health of all providers.
 */
export async function GET(req: NextRequest) {
  const providerParam = req.nextUrl.searchParams.get("provider") as ProviderId | null;

  if (providerParam) {
    const provider = getProvider(providerParam);
    const meta = provider.meta;

    // Initialise with credentials if needed.
    if (meta.requiresApiKey) {
      const apiKey = await getCredential(providerParam).catch(() => null);
      if (!apiKey) {
        const status: HealthStatus = {
          provider: providerParam,
          status: "unconfigured",
          message: "No API key set",
          checkedAt: new Date().toISOString(),
        };
        return NextResponse.json(status);
      }
      await provider.initialize({ provider: providerParam, apiKey });
    } else {
      await provider.initialize({ provider: providerParam });
    }

    const status = await provider.health();
    return NextResponse.json(status);
  }

  // All providers — return a summary.
  const results: HealthStatus[] = [];
  for (const meta of allProviderMetas) {
    const provider = getProvider(meta.id);
    if (meta.requiresApiKey) {
      const apiKey = await getCredential(meta.id).catch(() => null);
      if (!apiKey) {
        results.push({
          provider: meta.id,
          status: "unconfigured",
          message: "No API key set",
          checkedAt: new Date().toISOString(),
        });
        continue;
      }
      await provider.initialize({ provider: meta.id, apiKey });
    } else {
      await provider.initialize({ provider: meta.id });
    }
    const status = await provider.health();
    results.push(status);
  }

  return NextResponse.json({ data: results });
}
