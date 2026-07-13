import { NextRequest, NextResponse } from "next/server";
import { selectTool, selectTools } from "@/features/tool-intelligence/selector";

/**
 * POST /api/v1/tools/select
 *
 * Select the best tool(s) for a capability or set of capabilities.
 * Body: { capability: string } or { capabilities: string[] }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  if (body.capabilities && Array.isArray(body.capabilities)) {
    const selections = selectTools(body.capabilities);
    return NextResponse.json({ data: selections, total: selections.length });
  }

  if (body.capability) {
    const selection = selectTool(body.capability, { preferSafety: body.preferSafety, preferSpeed: body.preferSpeed });
    return NextResponse.json({ data: selection });
  }

  return NextResponse.json(
    { error: { code: "INVALID_REQUEST", message: "capability or capabilities is required" } },
    { status: 400 }
  );
}
