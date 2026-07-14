import { NextResponse } from "next/server";
import { analyzeLayout } from "@/features/visual-runtime/layout-inspector";
export async function GET() {
  return NextResponse.json({ data: analyzeLayout() });
}
