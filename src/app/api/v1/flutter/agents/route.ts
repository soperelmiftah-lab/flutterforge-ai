import { NextResponse } from "next/server";
import { agents, listAgents } from "@/features/planner/registry";

/**
 * GET /api/v1/flutter/agents
 *
 * Returns Flutter-specialist agents from the planner registry.
 * Includes all agents (the registry already has 17 agents, several of which
 * are Flutter specialists).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") ?? undefined;

  const list = category ? listAgents(category as any) : agents;
  return NextResponse.json({ data: list, total: list.length });
}
