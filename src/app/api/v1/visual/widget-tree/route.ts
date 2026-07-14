import { NextResponse } from "next/server";
import { captureWidgetTree } from "@/features/visual-runtime/widget-inspector";
export async function GET() {
  return NextResponse.json({ data: captureWidgetTree() });
}
