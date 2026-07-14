import { NextResponse } from "next/server";
import { getHistory } from "@/features/autonomous/history";
export async function GET() { return NextResponse.json({ data: getHistory(20) }); }
