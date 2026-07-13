import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/features/execution/history";
import { listApprovals } from "@/features/execution/approval";
import type { ToolCategory, ExecutionStatus } from "@/features/execution/types";

/**
 * GET /api/v1/execution/history
 *
 * Returns execution history + pending approvals.
 * Query params: toolId, category, status, initiatedBy, limit
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const toolId = sp.get("toolId") ?? undefined;
  const category = sp.get("category") as ToolCategory | null;
  const status = sp.get("status") as ExecutionStatus | null;
  const initiatedBy = sp.get("initiatedBy") as "user" | "agent" | null;
  const limit = sp.get("limit") ? Number(sp.get("limit")) : 100;

  const entries = getHistory({
    toolId,
    category: category ?? undefined,
    status: status ?? undefined,
    initiatedBy: initiatedBy ?? undefined,
    limit,
  });

  const approvals = listApprovals("pending");

  return NextResponse.json({
    data: entries,
    pendingApprovals: approvals,
    total: entries.length,
  });
}
