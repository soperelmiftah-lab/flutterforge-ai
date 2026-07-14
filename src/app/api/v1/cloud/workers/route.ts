import { NextResponse } from "next/server";
import { cloudState } from "@/features/cloud/state";

/**
 * GET /api/v1/cloud/workers
 *
 * Returns the worker registry + idle worker count.
 */
export async function GET() {
  const workers = cloudState.listWorkers();
  return NextResponse.json({ data: workers, idle: cloudState.getIdleWorkers().length });
}

/**
 * POST /api/v1/cloud/workers
 *
 * Add or remove a worker.
 * Body: { action: "add" | "remove" | "toggle", name?, type?, capabilities?, id? }
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { action } = body;
  if (action === "add") {
    const w = cloudState.addWorker({ name: body.name, type: body.type ?? "local", capabilities: body.capabilities ?? ["build", "test"] });
    return NextResponse.json({ data: w });
  }
  if (action === "remove") {
    return NextResponse.json({ data: { success: cloudState.removeWorker(body.id) } });
  }
  if (action === "toggle") {
    const w = cloudState.toggleWorkerStatus(body.id);
    return NextResponse.json({ data: w });
  }
  return NextResponse.json({ error: { code: "INVALID_ACTION" } }, { status: 400 });
}
