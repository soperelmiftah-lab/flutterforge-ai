import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/adapters
 *
 * Returns all runtime adapters (local, docker, remote, cloud, ci).
 */
export async function GET() {
  return NextResponse.json({ data: cloudState.listAdapters(), available: cloudState.getAvailableAdapters().length });
}
