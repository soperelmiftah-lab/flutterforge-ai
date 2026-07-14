import { NextRequest, NextResponse } from "next/server";
import { executePlan } from "@/features/planner/orchestrator";
import { evaluatePlan } from "@/features/planner/evaluation";
import { setSessionEvaluation, listSessions } from "@/features/planner/sessions";
import type { Plan } from "@/features/planner/types";

/**
 * POST /api/v1/planner/execute
 *
 * Execute a plan. Accepts either:
 * - { planId: string } — looks up plan from session storage
 * - { plan: Plan } — accepts plan object directly in body
 *
 * Body: { planId?: string, plan?: Plan }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  let plan: Plan | undefined;

  // Option 1: Look up by planId in sessions
  if (body.planId) {
    const sessions = listSessions();
    const session = sessions.find((s) => s.plan?.id === body.planId);
    if (session?.plan) {
      plan = session.plan;
    }
  }

  // Option 2: Accept plan directly in body
  if (!plan && body.plan) {
    plan = body.plan as Plan;
    // Rebuild the graph tasks Map if it was serialized as array
    if (plan.graph && Array.isArray(plan.graph.tasks)) {
      const tasksMap = new Map<string, any>();
      for (const t of plan.graph.tasks) {
        tasksMap.set(t.id, t);
      }
      (plan.graph as any).tasks = tasksMap;
    }
  }

  if (!plan) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Plan not found. Provide planId or plan object in body." } },
      { status: 404 }
    );
  }

  try {
    const { plan: executedPlan } = await executePlan(plan);
    const evaluation = evaluatePlan(executedPlan);

    // Try to update session if it exists
    const sessions = listSessions();
    const session = sessions.find((s) => s.plan?.id === plan!.id);
    if (session) {
      setSessionEvaluation(session.id, evaluation);
    }

    // Serialize: convert Map to array for JSON response
    const serializedPlan = {
      ...executedPlan,
      graph: {
        ...executedPlan.graph,
        tasks: Array.from(executedPlan.graph.tasks.values()),
        edges: executedPlan.graph.edges,
        criticalPath: executedPlan.graph.criticalPath,
        builtAt: executedPlan.graph.builtAt,
      },
    };

    return NextResponse.json({
      data: serializedPlan,
      evaluation,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "EXECUTE_FAILED", message: e instanceof Error ? e.message : "Execution failed" } },
      { status: 500 }
    );
  }
}
