import { NextRequest, NextResponse } from "next/server";
import { buildChain } from "@/features/tool-intelligence/chains";
import { generateRecommendations } from "@/features/tool-intelligence/recommendations";
import type { IntentType } from "@/features/planner/types";

// In-memory chain store (shared across routes).
export const chainStore = new Map<string, ReturnType<typeof buildChain>>();

/**
 * POST /api/v1/tools/analyze
 *
 * Analyze an objective + intent, build a tool chain, and generate
 * recommendations. This is the main entry point for the Tool Intelligence
 * Layer.
 *
 * Body: { objective: string, intentType: IntentType, requiredFiles?: string[] }
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

  try {
    const chain = buildChain(
      `task_${Date.now()}`,
      objective,
      (intentType ?? "feature-request") as IntentType,
      requiredFiles ?? []
    );
    chainStore.set(chain.id, chain);
    const recommendations = generateRecommendations(chain);

    return NextResponse.json({ data: { chain, recommendations } });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "ANALYZE_FAILED", message: e instanceof Error ? e.message : "Analysis failed" } },
      { status: 500 }
    );
  }
}
