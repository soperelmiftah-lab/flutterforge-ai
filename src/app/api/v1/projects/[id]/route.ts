import { NextRequest, NextResponse } from "next/server";
import type { Project, ProjectStatus } from "@/lib/types";

// Shared in-memory store with the collection route (phase 1 mock).
// In a future phase this is replaced by Prisma queries.
import { mockProjects } from "@/lib/mock-data";
let store: Project[] = [...mockProjects];

function find(id: string) {
  return store.find((p) => p.id === id);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = find(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return NextResponse.json({ data: project });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = store.findIndex((p) => p.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const input = await req.json().catch(() => ({}));
  const updated: Project = {
    ...store[idx],
    ...input,
    status: (input.status as ProjectStatus) ?? store[idx].status,
    updatedAt: new Date().toISOString(),
  };
  store[idx] = updated;
  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const before = store.length;
  store = store.filter((p) => p.id !== id);
  if (store.length === before) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  return new NextResponse(null, { status: 204 });
}
