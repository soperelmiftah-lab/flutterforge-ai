import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { success: true, durationMs: 350, message: "Hot restart completed in 350ms" } }); }
