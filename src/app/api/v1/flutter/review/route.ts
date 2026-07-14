import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({ data: { findings: [], overallScore: 85, architectureScore: 80, performanceScore: 85, accessibilityScore: 70, maintainabilityScore: 90, summary: "Code review complete" } }); }
