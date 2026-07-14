import { NextRequest, NextResponse } from "next/server";
import { optimizeChain, compareChains } from "@/features/tool-intelligence/optimizer";
import { getChain, storeChain } from "@/features/tool-intelligence/state";

/**
 * POST /api/v1/tools/optimize
 *
 * Optimize a tool chain — reduce tool count, parallelize, minimize tokens.
 * Body: { chainId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { chainId } = body;

  if (!chainId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "chainId is required" } },
      { status: 400 }
    );
  }

  const chain = getChain(chainId);
  if (!chain) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Chain not found" } },
      { status: 404 }
    );
  }

  try {
    const optimized = optimizeChain(chain);
    storeChain(optimized);
    const comparison = compareChains(chain, optimized);
    return NextResponse.json({ data: optimized, comparison });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "OPTIMIZE_FAILED", message: e instanceof Error ? e.message : "Optimization failed" } },
      { status: 500 }
    );
  }
}
