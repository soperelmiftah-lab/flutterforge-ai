import { NextResponse } from "next/server";
import { siteConfig } from "@/config/site";

/**
 * GET /api/v1/version
 * Returns the application & API version plus the planned future capabilities.
 * Used by the client to feature-detect.
 */
export async function GET() {
  return NextResponse.json({
    app: siteConfig.name,
    version: siteConfig.version,
    apiVersion: siteConfig.apiVersion,
    phase: 1,
    capabilities: {
      editor: true,
      fileExplorer: true,
      projectManagement: true,
      settings: true,
      aiAgent: false,
      livePreview: false,
      apkBuilder: false,
      multiAgent: false,
      integrations: {
        github: false,
        supabase: false,
        firebase: false,
        openrouter: false,
        ollama: false,
        mcp: false,
      },
    },
  });
}
