import { NextResponse } from "next/server";
import { generateRecommendations } from "@/features/tool-intelligence/recommendations";
import { getChain, listChains } from "@/features/tool-intelligence/state";

/**
 * GET /api/v1/tools/recommendations
 *
 * Returns recommendations for all chains (or a specific chain via ?chainId=).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const chainId = url.searchParams.get("chainId");

  if (chainId) {
    const chain = getChain(chainId);
    if (!chain) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Chain not found" } },
        { status: 404 }
      );
    }
    const recommendations = generateRecommendations(chain);
    return NextResponse.json({ data: recommendations, total: recommendations.length });
  }

  // Recommendations for all chains.
  const allRecs = listChains().flatMap((chain) => generateRecommendations(chain));
  return NextResponse.json({ data: allRecs, total: allRecs.length });
}
