import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({ data: { os: "linux", arch: "x64", java: { version: "17" }, androidSdk: { path: "/Android/Sdk", version: "34" }, chrome: { path: "/usr/bin/chrome", version: "120" }, git: { version: "2.39" }, pathEntries: [], environmentVariables: {} }, missingTools: [] }); }
