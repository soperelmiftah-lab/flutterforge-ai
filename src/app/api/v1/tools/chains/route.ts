import { NextResponse } from "next/server";
import { chainStore } from "../analyze/route";

/**
 * GET /api/v1/tools/chains
 *
 * Returns all built tool chains.
 */
export async function GET() {
  const chains = Array.from(chainStore.values());
  return NextResponse.json({ data: chains, total: chains.length });
}
