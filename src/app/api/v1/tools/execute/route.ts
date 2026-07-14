import { NextRequest, NextResponse } from "next/server";
import { executeChain } from "@/features/tool-intelligence/executor";
import { getChain, storeExecution, getExecution, listExecutions } from "@/features/tool-intelligence/state";

/**
 * POST /api/v1/tools/execute
 *
 * Execute a tool chain against the Execution Engine. Each step is dispatched
 * to the engine (which validates, checks permissions, runs the tool, generates
 * patches, records history, emits events). Per-step results + recovery data
 * are captured and returned.
 *
 * Body: { chainId: string, skipApproval?: boolean, maxRetries?: number }
 *
 * Response: { data: ChainExecution }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { chainId, skipApproval, maxRetries } = body;

  if (!chainId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "chainId is required" } },
      { status: 400 }
    );
  }

  const chain = getChain(chainId);
  if (!chain) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Chain not found" } },
      { status: 404 }
    );
  }

  try {
    const execution = await executeChain(chain, {
      skipApproval: skipApproval ?? true,
      maxRetries: maxRetries ?? 2,
    });
    storeExecution(execution);
    return NextResponse.json({ data: execution });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "EXECUTE_FAILED",
          message: e instanceof Error ? e.message : "Execution failed",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/tools/execute
 *
 * List all chain executions (newest first), or fetch a single execution by id
 * via ?executionId=...
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const executionId = url.searchParams.get("executionId");
  if (executionId) {
    const exec = getExecution(executionId);
    if (!exec) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Execution not found" } },
        { status: 404 }
      );
    }
    return NextResponse.json({ data: exec });
  }
  const execs = listExecutions();
  return NextResponse.json({ data: execs, total: execs.length });
}
