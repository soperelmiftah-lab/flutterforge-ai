import { NextResponse } from "next/server";
import { widgetCatalog } from "@/features/flutter-platform/widget-catalog";
export async function GET() { return NextResponse.json({ data: widgetCatalog, total: widgetCatalog.length }); }
