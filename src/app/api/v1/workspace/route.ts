import { NextRequest, NextResponse } from "next/server";
import { mockFileTree, mockActivity } from "@/lib/mock-data";

/**
 * /api/v1/workspace
 * Mock workspace state: the active project's file tree plus recent activity.
 * Phase 1 returns the demo workspace; future phases scope this to a project id
 * and persist open tabs/layout via the Workspace table.
 */
export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId") ?? "prj_forge_demo";
  return NextResponse.json({
    data: {
      projectId,
      fileTree: mockFileTree,
      activity: mockActivity,
      layout: {
        explorer: { size: 18 },
        editor: { size: 54 },
        rightPanel: { size: 28, open: true },
        bottomPanel: { open: false },
      },
    },
  });
}
