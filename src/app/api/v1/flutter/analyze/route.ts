import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) { return NextResponse.json({ data: { sdkVersion: ">=3.3.0", flutterVersion: "3.22.0", stateManagement: "riverpod", routing: "navigator", packageCount: 3, issues: [], recommendations: [] } }); }
