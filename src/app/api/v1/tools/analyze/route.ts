import { NextRequest, NextResponse } from "next/server";
import { buildChain } from "@/features/tool-intelligence/chains";
import { buildChainWithAI } from "@/features/tool-intelligence/ai-builder";
import { generateRecommendations } from "@/features/tool-intelligence/recommendations";
import { storeChain } from "@/features/tool-intelligence/state";
import type { IntentType } from "@/features/planner/types";
import type { ToolChain, Recommendation } from "@/features/tool-intelligence/types";

/**
 * POST /api/v1/tools/analyze
 *
 * Analyze an objective + intent, build a tool chain via the AI Chat Engine,
 * and generate recommendations. This is the main entry point for the Tool
 * Intelligence Layer.
 *
 * Body: { objective: string, intentType: IntentType, requiredFiles?: string[] }
 *
 * Response: { data: { chain, recommendations, rationale, aiGenerated } }
 *   - aiGenerated: true if the AI built the chain, false if it fell back to
 *     the template-based builder.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { objective, intentType, requiredFiles } = body;

  if (!objective?.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "objective is required" } },
      { status: 400 }
    );
  }

  const taskId = `task_${Date.now()}`;
  const intent = (intentType ?? "feature-request") as IntentType;
  const files = Array.isArray(requiredFiles) ? requiredFiles : [];

  try {
    // 1. Try the AI-driven builder first.
    const aiResult = await buildChainWithAI(taskId, objective, intent, files);

    let chain: ToolChain;
    let rationale: string;
    let aiGenerated: boolean;

    if (aiResult) {
      chain = aiResult.chain;
      rationale = aiResult.rationale;
      aiGenerated = true;
    } else {
      // 2. Fall back to the template-based builder.
      chain = buildChain(taskId, objective, intent, files);
      rationale =
        "Template-based chain (AI builder unavailable). Tools selected from intent-type defaults.";
      aiGenerated = false;
    }

    storeChain(chain);
    const recommendations: Recommendation[] = generateRecommendations(chain);

    return NextResponse.json({
      data: { chain, recommendations, rationale, aiGenerated },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "ANALYZE_FAILED",
          message: e instanceof Error ? e.message : "Analysis failed",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/tools/analyze
 *
 * Returns all built chains (kept here for backward compatibility with the
 * old `/tools/chains` route).
 */
export async function GET() {
  const { listChains } = await import("@/features/tool-intelligence/state");
  const chains = listChains();
  return NextResponse.json({ data: chains, total: chains.length });
}
