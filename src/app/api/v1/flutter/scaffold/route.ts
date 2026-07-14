import { NextRequest, NextResponse } from "next/server";
import { getTemplate } from "@/features/flutter-platform/templates";
import { createRequest, execute } from "@/features/execution/core";
import { vfs } from "@/features/execution/filesystem";
import type { ExecutionResult } from "@/features/execution/types";

/**
 * POST /api/v1/flutter/scaffold
 *
 * Scaffold a Flutter template into the virtual filesystem. Each file is
 * written via the Execution Engine's execute() API (which routes through
 * permissions, approval, queue, patch, history, telemetry, events).
 *
 * If the target file already exists, we fall back to `fs.write_file`
 * (overwrite) so scaffolding is idempotent.
 *
 * Body: { templateId: string }
 *
 * Response: { data: { templateId, files: Array<{ path, result: ExecutionResult }> } }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { templateId } = body;

  if (!templateId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "templateId is required" } },
      { status: 400 }
    );
  }

  const template = getTemplate(templateId);
  if (!template) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: `Template not found: ${templateId}` } },
      { status: 404 }
    );
  }

  const results: Array<{ path: string; result: ExecutionResult }> = [];

  for (const file of template.files) {
    // If the file already exists, use write_file (overwrite). Otherwise create_file.
    const exists = vfs.exists(file.path as any);
    const toolId = exists ? "fs.write_file" : "fs.create_file";

    const request = createRequest({
      toolId,
      parameters: { path: file.path, content: file.content },
      initiatedBy: "user",
      skipApproval: true,
      priority: 1,
    });
    const result = await execute(request);
    results.push({ path: file.path, result });
  }

  return NextResponse.json({
    data: {
      templateId: template.id,
      templateName: template.name,
      files: results,
    },
  });
}
