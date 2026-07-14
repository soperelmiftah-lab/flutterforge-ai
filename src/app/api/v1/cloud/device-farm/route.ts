import { NextResponse } from "next/server";
import { listDevices, getAvailableDevices } from "@/features/cloud/device-farm";

export async function GET() {
  return NextResponse.json({ data: listDevices(), available: getAvailableDevices().length });
}
