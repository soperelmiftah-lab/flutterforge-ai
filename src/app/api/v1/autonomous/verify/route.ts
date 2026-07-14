import { NextRequest, NextResponse } from "next/server";
import { verifyRepair } from "@/features/autonomous/verification";
import { detectRegressions } from "@/features/autonomous/regression";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const verification = verifyRepair({
    beforeScore: body.beforeScore ?? 70,
    afterScore: body.afterScore ?? 85,
    beforeIssueCount: body.beforeIssueCount ?? 3,
    afterIssueCount: body.afterIssueCount ?? 1,
    regressions: body.regressions ?? [],
  });
  const regression = detectRegressions({
    beforeErrors: body.beforeErrors ?? 3, afterErrors: body.afterErrors ?? 1,
    beforeWarnings: body.beforeWarnings ?? 5, afterWarnings: body.afterWarnings ?? 5,
    beforeLayoutIssues: body.beforeLayoutIssues ?? 3, afterLayoutIssues: body.afterLayoutIssues ?? 2,
  });
  return NextResponse.json({ data: { verification, regression } });
}
