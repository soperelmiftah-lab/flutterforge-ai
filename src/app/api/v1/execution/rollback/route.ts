import { NextRequest, NextResponse } from "next/server";
import { restoreSnapshot, listSnapshots, undo, redo } from "@/features/execution/rollback";

/**
 * POST /api/v1/execution/rollback
 *
 * Restore a snapshot, undo, or redo.
 * Body: { action: "restore" | "undo" | "redo", snapshotId?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const action = body.action as "restore" | "undo" | "redo" | "list";

  if (action === "restore") {
    if (!body.snapshotId) {
      return NextResponse.json(
        { error: { code: "INVALID_REQUEST", message: "snapshotId is required for restore" } },
        { status: 400 }
      );
    }
    const success = restoreSnapshot(body.snapshotId);
    return NextResponse.json({ data: { success } });
  }

  if (action === "undo") {
    const snapshot = undo();
    return NextResponse.json({ data: snapshot ?? null });
  }

  if (action === "redo") {
    const snapshot = redo();
    return NextResponse.json({ data: snapshot ?? null });
  }

  if (action === "list") {
    return NextResponse.json({ data: listSnapshots() });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "action must be restore, undo, redo, or list" } },
    { status: 400 }
  );
}
