import { NextResponse } from "next/server";
import { listWorkflows } from "@/features/planner/workflow";

/**
 * GET /api/v1/planner/workflows
 *
 * Returns all reusable workflows.
 */
export async function GET() {
  const workflows = listWorkflows();
  return NextResponse.json({ data: workflows, total: workflows.length });
}
