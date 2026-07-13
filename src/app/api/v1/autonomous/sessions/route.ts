import { NextResponse } from "next/server";
import { getSessions } from "@/features/autonomous/sessions";
export async function GET() { return NextResponse.json({ data: getSessions() }); }
