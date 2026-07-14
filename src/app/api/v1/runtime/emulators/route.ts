import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ data: [{ id: "Pixel_7", name: "Pixel 7 API 34", platform: "android", isRunning: true, hasSnapshot: true }], total: 1 }); }
