import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/artifacts
 *
 * Returns all artifacts.
 */
export async function GET() {
  const artifacts = cloudState.listArtifacts();
  return NextResponse.json({ data: artifacts, total: artifacts.length });
}

/**
 * DELETE /api/v1/cloud/artifacts?id=<id>
 *
 * Delete an artifact by id.
 */
export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: { code: "INVALID_REQUEST", message: "id is required" } }, { status: 400 });
  return NextResponse.json({ data: { success: cloudState.deleteArtifact(id) } });
}
