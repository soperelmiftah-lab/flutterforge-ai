/**
 * @module features/tool-intelligence/recommendations
 *
 * Recommendation Engine — suggests better, safer, faster, or cheaper tool
 * chains based on the current chain and historical learning data.
 */

import type { Recommendation, RecommendationKind, ToolChain } from "../types";
import { optimizeChain, compareChains } from "../optimizer";
import { uid } from "@/lib/utils";

/** Generate recommendations for a tool chain. */
export function generateRecommendations(chain: ToolChain): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Safer chain — optimize for safety (reduce risk).
  const saferRec = generateSaferRecommendation(chain);
  if (saferRec) recommendations.push(saferRec);

  // 2. Faster chain — optimize for speed.
  const fasterRec = generateFasterRecommendation(chain);
  if (fasterRec) recommendations.push(fasterRec);

  // 3. Cheaper chain — optimize for token cost.
  const cheaperRec = generateCheaperRecommendation(chain);
  if (cheaperRec) recommendations.push(cheaperRec);

  return recommendations;
}

/** Generate a "safer" recommendation. */
function generateSaferRecommendation(chain: ToolChain): Recommendation | null {
  if (chain.riskScore < 0.2) return null; // already safe
  const optimized = optimizeChain({ ...chain });
  const diff = compareChains(chain, optimized);
  if (diff.riskReduced < 0.05) return null;

  return {
    id: uid("rec"),
    kind: "safer",
    title: "Safer chain available",
    description: `Optimizing the chain can reduce risk by ${(diff.riskReduced * 100).toFixed(0)}% by removing redundant risky steps.`,
    originalChainId: chain.id,
    suggestedChainId: optimized.id,
    improvements: { riskReduced: diff.riskReduced, stepsReduced: diff.stepsReduced },
    createdAt: new Date().toISOString(),
  };
}

/** Generate a "faster" recommendation. */
function generateFasterRecommendation(chain: ToolChain): Recommendation | null {
  const optimized = optimizeChain({ ...chain });
  const diff = compareChains(chain, optimized);
  if (diff.timeSavedMs < 500) return null;

  return {
    id: uid("rec"),
    kind: "faster",
    title: "Faster chain available",
    description: `Parallelizing independent steps can save ~${(diff.timeSavedMs / 1000).toFixed(1)}s.`,
    originalChainId: chain.id,
    suggestedChainId: optimized.id,
    improvements: { timeSavedMs: diff.timeSavedMs, stepsReduced: diff.stepsReduced },
    createdAt: new Date().toISOString(),
  };
}

/** Generate a "cheaper" recommendation. */
function generateCheaperRecommendation(chain: ToolChain): Recommendation | null {
  const optimized = optimizeChain({ ...chain });
  const diff = compareChains(chain, optimized);
  if (diff.tokensSaved < 50) return null;

  return {
    id: uid("rec"),
    kind: "cheaper",
    title: "Lower token cost available",
    description: `Removing redundant steps can save ~${diff.tokensSaved} tokens.`,
    originalChainId: chain.id,
    suggestedChainId: optimized.id,
    improvements: { tokensSaved: diff.tokensSaved, stepsReduced: diff.stepsReduced },
    createdAt: new Date().toISOString(),
  };
}

/** Get recommendation kind metadata (for UI). */
export function recommendationKindMeta(kind: RecommendationKind): { label: string; icon: string; color: string } {
  const meta: Record<RecommendationKind, { label: string; icon: string; color: string }> = {
    safer: { label: "Safer", icon: "🛡️", color: "text-emerald-600 dark:text-emerald-400" },
    faster: { label: "Faster", icon: "⚡", color: "text-sky-600 dark:text-sky-400" },
    cheaper: { label: "Cheaper", icon: "💰", color: "text-amber-600 dark:text-amber-400" },
    "more-reliable": { label: "More Reliable", icon: "✅", color: "text-violet-600 dark:text-violet-400" },
  };
  return meta[kind];
}
