import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) { return NextResponse.json({ data: { id: "proj_demo", name: "Forge Demo", path: "/projects/forge_demo", flutterVersion: "3.22.0", dartVersion: "3.4.0", platforms: ["android", "web"], lastOpenedAt: new Date().toISOString(), createdAt: new Date().toISOString(), isOpen: true } }); }
