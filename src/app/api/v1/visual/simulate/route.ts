import { NextRequest, NextResponse } from "next/server";
import { visualState } from "@/features/visual-runtime/state";

/**
 * POST /api/v1/visual/simulate
 *
 * Simulate a user interaction on the connected device. Used to drive the
 * visual runtime without a real device.
 *
 * Body: {
 *   type: "tap" | "scroll" | "navigation" | "keyboard",
 *   x?: number, y?: number, widget?: string,
 *   dx?: number, dy?: number,
 *   from?: string, to?: string,
 *   key?: string
 * }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { type } = body;
  if (!type) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "type is required" } },
      { status: 400 }
    );
  }
  let event;
  switch (type) {
    case "tap":
      event = visualState.simulateTap(body.x ?? 180, body.y ?? 400, body.widget);
      break;
    case "scroll":
      event = visualState.simulateScroll(body.dx ?? 0, body.dy ?? -120);
      break;
    case "navigation":
      event = visualState.simulateNavigation(body.from ?? "/", body.to ?? "/details");
      break;
    case "keyboard":
      event = visualState.simulateKeyPress(body.key ?? "Enter");
      break;
    default:
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: `Unknown type: ${type}` } },
        { status: 400 }
      );
  }
  return NextResponse.json({ data: event });
}
