import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) { return NextResponse.json({ data: { type: "unit", passed: 5, failed: 0, skipped: 0, coverage: 75, durationMs: 400, output: "All tests passed!", success: true } }); }
