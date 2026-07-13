import { NextRequest, NextResponse } from "next/server";
import { createRecoveryPlan, executeRecovery } from "@/features/tool-intelligence/recovery";
import type { ChainStep } from "@/features/tool-intelligence/types";

/**
 * POST /api/v1/tools/recover
 *
 * Create a recovery plan for a failed step, or execute an existing plan.
 * Body: { action: "create" | "execute", failedStep?: ChainStep, failureReason?: string, plan?: RecoveryPlan }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as "create" | "execute";

  if (action === "create") {
    if (!body.failedStep || !body.failureReason) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "failedStep and failureReason are required" } },
        { status: 400 }
      );
    }
    const plan = createRecoveryPlan(body.failedStep as ChainStep, body.failureReason, body.retryCount ?? 0);
    return NextResponse.json({ data: plan });
  }

  if (action === "execute") {
    if (!body.plan) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "plan is required" } },
        { status: 400 }
      );
    }
    const result = executeRecovery(body.plan);
    return NextResponse.json({ data: result });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "action must be create or execute" } },
    { status: 400 }
  );
}
