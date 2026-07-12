import { NextRequest, NextResponse } from "next/server";
import { approve } from "@/features/execution/core";
import { listApprovals } from "@/features/execution/approval";

/**
 * POST /api/v1/execution/approve
 *
 * Approve a pending execution request.
 * Body: { requestId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { requestId } = body;

  if (!requestId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "requestId is required" } },
      { status: 400 }
    );
  }

  const success = approve(requestId);
  if (!success) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "No pending approval for that request" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: { requestId, approved: true }, pending: listApprovals("pending") });
}
