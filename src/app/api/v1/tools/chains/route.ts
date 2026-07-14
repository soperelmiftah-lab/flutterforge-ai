import { NextResponse } from "next/server";
import { listChains } from "@/features/tool-intelligence/state";

/**
 * GET /api/v1/tools/chains
 *
 * Returns all built tool chains.
 */
export async function GET() {
  const chains = listChains();
  return NextResponse.json({ data: chains, total: chains.length });
}
