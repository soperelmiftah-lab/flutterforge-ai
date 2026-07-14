import { NextResponse } from "next/server";
import { listWorkers, getIdleWorkers } from "@/features/cloud/workers";

export async function GET() {
  return NextResponse.json({ data: listWorkers(), idle: getIdleWorkers().length });
}
