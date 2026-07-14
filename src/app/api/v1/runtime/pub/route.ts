import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) { return NextResponse.json({ data: { command: "get", success: true, output: "Resolving dependencies...\nDone!", durationMs: 200, packagesAffected: 3 } }); }
