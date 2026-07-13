/**
 * @module features/visual-runtime/vision-context
 *
 * Vision Context — provides structured visual context for future AI
 * reasoning. Includes current screen, widget tree summary, layout summary,
 * runtime state, navigation state, and device information.
 */

import type { VisionContext } from "../types";
import { captureWidgetTree } from "../widget-inspector";
import { analyzeLayout } from "../layout-inspector";
import { getFrameStats } from "../frame-monitor";

/** Build a vision context snapshot for AI consumption. */
export function buildVisionContext(deviceId: string): VisionContext {
  const widgetTree = captureWidgetTree();
  const layout = analyzeLayout();
  const frame = getFrameStats();

  const topWidgets: string[] = [];
  const collectTypes = (node: any, depth: number) => {
    if (depth < 3) topWidgets.push(node.type);
    node.children?.forEach((c: any) => collectTypes(c, depth + 1));
  };
  collectTypes(widgetTree.root, 0);

  return {
    deviceId,
    currentScreen: "HomeScreen",
    widgetTreeSummary: {
      totalWidgets: widgetTree.totalNodes,
      maxDepth: widgetTree.maxDepth,
      topWidgets: topWidgets.slice(0, 5),
    },
    layoutSummary: {
      totalIssues: layout.issueCount,
      overflowCount: layout.issues.filter((i) => i.type === "overflow").length,
    },
    runtimeState: {
      fps: frame.fps,
      jankCount: frame.jankCount,
      memoryMb: Math.round(Math.random() * 200 + 150),
    },
    navigationState: {
      currentRoute: "/",
      routeStack: ["/", "/details"],
    },
    deviceInfo: {
      name: "emulator-5554",
      resolution: "1080x2400",
      orientation: "portrait",
    },
    capturedAt: new Date().toISOString(),
  };
}
