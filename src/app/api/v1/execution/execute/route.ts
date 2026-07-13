import { NextRequest, NextResponse } from "next/server";
import { createRequest, execute } from "@/features/execution/core";
import { getToolDescriptor } from "@/features/execution/registry";
import type { ExecutionRequest } from "@/features/execution/types";

/**
 * POST /api/v1/execution/execute
 *
 * The central execution endpoint. Every agent operation goes through here.
 * Validates the tool, checks permissions, gates on approval, queues, and
 * executes.
 *
 * Body: ExecutionRequest (without id/createdAt — those are generated).
 */
export async function POST(req: NextRequest) {
  let body: Partial<ExecutionRequest> & { toolId: string; parameters: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  if (!body.toolId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "toolId is required" } },
      { status: 400 }
    );
  }

  // Validate the tool exists.
  const descriptor = getToolDescriptor(body.toolId);
  if (!descriptor) {
    return NextResponse.json(
      { error: { code: "UNKNOWN_TOOL", message: `Unknown tool: ${body.toolId}` } },
      { status: 404 }
    );
  }

  // Build the request.
  const request = createRequest({
    toolId: body.toolId,
    parameters: body.parameters ?? {},
    initiatedBy: body.initiatedBy ?? "user",
    agentId: body.agentId,
    priority: body.priority,
    skipApproval: body.skipApproval,
  });

  // Execute.
  const result = await execute(request);

  // Return the result. If pending-approval, return 202; success 200; failure 500.
  const status =
    result.status === "pending-approval" ? 202 :
    result.status === "failed" ? 500 :
    200;
  return NextResponse.json({ data: result, request }, { status });
}
