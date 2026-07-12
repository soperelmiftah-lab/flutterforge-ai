import { NextRequest, NextResponse } from "next/server";
import { executePlan } from "@/features/planner/orchestrator";
import { evaluatePlan } from "@/features/planner/evaluation";
import { setSessionEvaluation, getSession } from "@/features/planner/sessions";
import { listSessions } from "@/features/planner/sessions";

/**
 * POST /api/v1/planner/execute
 *
 * Execute a plan by id. Dispatches tasks to agents via the orchestrator.
 * Body: { planId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { planId } = body;

  if (!planId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "planId is required" } },
      { status: 400 }
    );
  }

  // Find the plan in a session.
  const sessions = listSessions();
  const session = sessions.find((s) => s.plan?.id === planId);
  if (!session?.plan) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Plan not found" } },
      { status: 404 }
    );
  }

  try {
    const { plan: executedPlan } = await executePlan(session.plan);
    const evaluation = evaluatePlan(executedPlan);
    setSessionEvaluation(session.id, evaluation);

    return NextResponse.json({
      data: {
        ...executedPlan,
        graph: {
          ...executedPlan.graph,
          tasks: Array.from(executedPlan.graph.tasks.values()),
        },
      },
      evaluation,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: { code: "EXECUTE_FAILED", message: e instanceof Error ? e.message : "Execution failed" } },
      { status: 500 }
    );
  }
}

void getSession;
