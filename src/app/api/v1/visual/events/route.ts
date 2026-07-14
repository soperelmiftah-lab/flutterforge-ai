import { NextRequest, NextResponse } from "next/server";
import { getEvents } from "@/features/visual-runtime/events";
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as any;
  return NextResponse.json({ data: getEvents(type, 50) });
}
