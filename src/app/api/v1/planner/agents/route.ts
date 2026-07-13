import { NextResponse } from "next/server";
import { listAgents, agentStats } from "@/features/planner/registry";

/**
 * GET /api/v1/planner/agents
 *
 * Returns all registered agents + health stats.
 */
export async function GET() {
  const agents = listAgents();
  const stats = agentStats();
  return NextResponse.json({ data: agents, stats, total: agents.length });
}
