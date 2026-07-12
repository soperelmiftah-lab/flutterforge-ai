import { NextRequest, NextResponse } from "next/server";
import { allProviderMetas } from "@/features/ai/provider/registry";
import {
  getAllCredentialViews,
  getCredentialView,
  setCredential,
  deleteCredential,
} from "@/features/ai/registry/credentials";
import type { ProviderId } from "@/features/ai/provider/types";

/**
 * /api/v1/ai/providers
 *
 *   GET    — list all providers + masked credential views
 *   POST   — store an encrypted API key for a provider
 *   DELETE — remove a provider's credentials
 */

export async function GET() {
  try {
    const credentials = await getAllCredentialViews();
    const credMap = new Map(credentials.map((c) => [c.provider, c]));

    const data = allProviderMetas.map((meta) => ({
      ...meta,
      credential: credMap.get(meta.id) ?? { provider: meta.id, hasKey: false },
    }));

    return NextResponse.json({ data });
  } catch (e: unknown) {
    // If DB isn't available, still return provider metas without credentials.
    const data = allProviderMetas.map((meta) => ({
      ...meta,
      credential: { provider: meta.id, hasKey: false },
    }));
    return NextResponse.json({ data, warning: "credentials unavailable" });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { provider, apiKey } = body ?? {};

  if (!provider || !apiKey) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "provider and apiKey are required" } },
      { status: 400 }
    );
  }

  try {
    await setCredential(provider as ProviderId, apiKey);
    const view = await getCredentialView(provider as ProviderId);
    return NextResponse.json({ data: view });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "UNKNOWN", message: e instanceof Error ? e.message : "Failed to save credential" } },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const provider = req.nextUrl.searchParams.get("provider") as ProviderId | null;
  if (!provider) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "provider query param is required" } },
      { status: 400 }
    );
  }

  try {
    await deleteCredential(provider);
    return NextResponse.json({ data: { provider, hasKey: false } });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "UNKNOWN", message: e instanceof Error ? e.message : "Failed to delete credential" } },
      { status: 500 }
    );
  }
}
