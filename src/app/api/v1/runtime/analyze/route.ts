import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { diagnostics: [{ id: "d1", severity: "info", code: "prefer_const", message: "Prefer const", file: "lib/main.dart", line: 10, column: 5 }], errorCount: 0, warningCount: 0, infoCount: 1, success: true, durationMs: 300 } }); }
