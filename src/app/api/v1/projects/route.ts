import { NextRequest, NextResponse } from "next/server";
import type { Project } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";

/**
 * /api/v1/projects
 * Mock project endpoints for phase 1. The shape mirrors the future Prisma-backed
 * implementation so the client can switch over without changes.
 *
 *   GET    /api/v1/projects           → list projects
 *   POST   /api/v1/projects           → create a project
 *   GET    /api/v1/projects/:id       → fetch one
 *   PATCH  /api/v1/projects/:id       → update
 *   DELETE /api/v1/projects/:id       → delete
 */

// In-memory store so mutations persist across requests during the session.
let store: Project[] = [...mockProjects];

function body<T>(req: NextRequest): Promise<T> {
  return req.json().catch(() => ({} as T));
}

export async function GET() {
  return NextResponse.json({ data: store });
}

export async function POST(req: NextRequest) {
  const input = await body<{
    name?: string;
    description?: string;
    framework?: string;
    template?: string;
  }>(req);

  if (!input.name || input.name.trim().length < 2) {
    return NextResponse.json(
      { error: "name is required (min 2 chars)" },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();
  const project: Project = {
    id: `prj_${Math.random().toString(36).slice(2, 10)}`,
    name: input.name,
    description: input.description ?? "A new Flutter project.",
    framework: input.framework ?? "Flutter 3.22",
    status: "draft",
    favorite: false,
    color: "emerald",
    lastOpenedAt: now,
    createdAt: now,
    updatedAt: now,
    filesCount: 1,
    collaborators: 1,
  };
  store = [project, ...store];
  return NextResponse.json({ data: project }, { status: 201 });
}
