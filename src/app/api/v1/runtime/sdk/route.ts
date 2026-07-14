import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ data: [{ version: "3.22.0", channel: "stable", dartVersion: "3.4.0", path: "/home/z/flutter", isCurrent: true, isValid: true }], current: { version: "3.22.0", channel: "stable", dartVersion: "3.4.0", path: "/home/z/flutter", isCurrent: true, isValid: true } }); }
