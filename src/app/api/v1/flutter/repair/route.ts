import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { issues: [], autoFixableCount: 0, criticalCount: 0, summary: "No issues detected" } }); }
