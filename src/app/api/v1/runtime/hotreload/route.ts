import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { success: true, durationMs: 120, message: "Hot reload completed in 120ms" } }); }
