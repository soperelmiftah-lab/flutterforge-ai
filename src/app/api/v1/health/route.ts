import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

/**
 * GET /api/v1/health
 * Liveness & readiness probe. Reports per-service status so a future
 * orchestrator (or the status bar) can surface degraded modules.
 */
export async function GET() {
  const startedAt = Date.now();
  const health = {
    status: "ok" as const,
    version: siteConfig.version,
    apiVersion: siteConfig.apiVersion,
    uptime: process.uptime(),
    timestamp: new Date(startedAt).toISOString(),
    services: {
      api: "ok" as const,
      database: "ok" as const, // Prisma SQLite — present but unused in phase 1
      editor: "ok" as const,
      ai: "degraded" as const, // arrives phase 2
      preview: "degraded" as const, // arrives phase 3
      build: "degraded" as const, // arrives phase 3
    },
  };
  return NextResponse.json(health);
}
