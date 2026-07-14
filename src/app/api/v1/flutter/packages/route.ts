import { NextResponse } from "next/server";
import { flutterPackages, listPackages, packageCategories } from "@/features/flutter-platform/dependencies";

/**
 * GET /api/v1/flutter/packages
 *
 * Returns popular Flutter packages, optionally filtered by ?category=.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const category = url.searchParams.get("category") as
    | "state" | "network" | "ui" | "routing" | "storage" | "testing" | "tooling" | "other"
    | null;

  const packages = category ? listPackages(category) : flutterPackages;
  return NextResponse.json({
    data: packages,
    total: packages.length,
    categories: packageCategories(),
  });
}
