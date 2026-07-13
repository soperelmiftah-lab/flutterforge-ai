import { NextRequest, NextResponse } from "next/server";
import { simulateChain } from "@/features/tool-intelligence/simulation";
import { chainStore } from "../analyze/route";

/**
 * POST /api/v1/tools/simulate
 *
 * Simulate a tool chain (dry run). Never modifies the project.
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

  const chain = chainStore.get(chainId);
  if (!chain) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Chain not found" } },
      { status: 404 }
    );
  }

  try {
    const result = simulateChain(chain);
    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "SIMULATE_FAILED", message: e instanceof Error ? e.message : "Simulation failed" } },
      { status: 500 }
    );
  }
}
