import { NextResponse } from "next/server";
import { autonomousState } from "@/features/autonomous/state";

/**
 * GET /api/v1/autonomous/learning
 *
 * Returns the learning summary (success rate, common strategies, common issues).
 */
export async function GET() {
  return NextResponse.json({
    data: autonomousState.getLearningSummary(),
    records: autonomousState.listLearning().slice(0, 50),
  });
}
