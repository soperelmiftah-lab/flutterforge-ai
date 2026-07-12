import { NextRequest, NextResponse } from "next/server";
import { plan } from "@/features/planner/core";
import { createSession } from "@/features/planner/sessions";
import { generateThinkingSteps } from "@/features/planner/thinking";
import { getReasoningConfig } from "@/features/planner/reasoning";
import { emitTimeline } from "@/features/planner/timeline";

/**
 * POST /api/v1/planner/plan
 *
 * The central planning endpoint. Converts a natural-language request into
 * a structured Plan (intent → goal → tasks → graph → strategy → agents).
 *
 * Body: { input: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const input = body.input as string | undefined;

  if (!input?.trim()) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "input is required" } },
      { status: 400 }
    );
  }

  try {
    const { intent, goal, plan: thePlan } = plan(input);
    const thinkingSteps = generateThinkingSteps(intent.type, getReasoningConfig());
    const session = createSession(intent, goal, thinkingSteps);
    session.plan = thePlan;

    emitTimeline("intent-detected", `Intent: ${intent.type}`, undefined, undefined, intent.rawInput);
    emitTimeline("goal-created", `Goal: ${goal.title}`);
    emitTimeline("plan-created", `Plan with ${thePlan.tasks.length} tasks`);

    return NextResponse.json({
      data: { intent, goal, plan: serializePlan(thePlan), session },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "PLAN_FAILED", message: e instanceof Error ? e.message : "Planning failed" } },
      { status: 500 }
    );
  }
}

/** Serialize a Plan (convert Map to array for JSON). */
function serializePlan(plan: any) {
  return {
    ...plan,
    graph: {
      ...plan.graph,
      tasks: Array.from(plan.graph.tasks.values()),
      edges: plan.graph.edges,
      criticalPath: plan.graph.criticalPath,
      builtAt: plan.graph.builtAt,
    },
  };
}
