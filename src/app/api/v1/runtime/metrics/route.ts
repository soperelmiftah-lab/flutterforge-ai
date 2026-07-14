import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ data: { runCount: 0, buildCount: 0, analyzeCount: 0, testCount: 0, pubCount: 0, averageBuildTimeMs: 0, averageStartupTimeMs: 0, crashCount: 0, hotReloadCount: 0, averageHotReloadDurationMs: 0 } }); }
