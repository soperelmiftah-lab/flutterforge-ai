import { NextResponse } from "next/server";
import { captureRenderTree } from "@/features/visual-runtime/render-tree";
export async function GET() {
  return NextResponse.json({ data: captureRenderTree() });
}
