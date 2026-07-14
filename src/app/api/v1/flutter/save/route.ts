import { NextRequest, NextResponse } from "next/server";
import { createRequest, execute } from "@/features/execution/core";
import type { ExecutionResult } from "@/features/execution/types";

/**
 * POST /api/v1/flutter/save
 *
 * Save generated Dart code to the virtual filesystem via the Execution
 * Engine. Routes through validation, permissions, queue, patch, history,
 * and emits events.
 *
 * Body: { path: string, content: string }
 *
 * Response: { data: ExecutionResult }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { path, content } = body;

  if (!path?.trim() || typeof content !== "string") {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "path and content are required" } },
      { status: 400 }
    );
  }

  try {
    // Try create_file first; if it fails (file exists), fall back to write_file.
    const createReq = createRequest({
      toolId: "fs.create_file",
      parameters: { path, content },
      initiatedBy: "user",
      skipApproval: true,
      priority: 1,
    });
    let result: ExecutionResult = await execute(createReq);

    if (result.status === "failed") {
      const writeReq = createRequest({
        toolId: "fs.write_file",
        parameters: { path, content },
        initiatedBy: "user",
        skipApproval: true,
        priority: 1,
      });
      result = await execute(writeReq);
    }

    return NextResponse.json({ data: result });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "SAVE_FAILED",
          message: e instanceof Error ? e.message : "Save failed",
        },
      },
      { status: 500 }
    );
  }
}
