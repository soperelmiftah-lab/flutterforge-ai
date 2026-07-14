import { NextResponse } from "next/server";
import { listArtifacts } from "@/features/cloud/artifacts";

export async function GET() {
  const artifacts = listArtifacts();
  return NextResponse.json({ data: artifacts, total: artifacts.length });
}
