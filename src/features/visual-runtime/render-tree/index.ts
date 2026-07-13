/**
 * @module features/visual-runtime/render-tree
 *
 * Render Tree — exposes RenderObjects with depth, layout time, and paint time.
 */

import type { RenderTree, RenderNode } from "../types";
import { uid } from "@/lib/utils";

/** Capture the render tree (mock — would use Flutter DevTools). */
export function captureRenderTree(): RenderTree {
  const root: RenderNode = {
    id: uid("r"),
    type: "RenderView",
    depth: 0,
    layoutTimeMs: 0.2,
    paintTimeMs: 0.1,
    children: [
      {
        id: uid("r"),
        type: "RenderSemanticsAnnotations",
        depth: 1,
        layoutTimeMs: 0.1,
        paintTimeMs: 0.05,
        children: [
          {
            id: uid("r"),
            type: "RenderFlex",
            depth: 2,
            layoutTimeMs: 0.8,
            paintTimeMs: 0.3,
            children: [
              { id: uid("r"), type: "RenderParagraph", depth: 3, layoutTimeMs: 0.4, paintTimeMs: 0.2, children: [] },
              { id: uid("r"), type: "RenderSemanticsGestureHandler", depth: 3, layoutTimeMs: 0.1, paintTimeMs: 0.1, children: [] },
            ],
          },
        ],
      },
    ],
  };

  const totalNodes = countNodes(root);
  return {
    root,
    totalNodes,
    totalLayoutTimeMs: sumLayout(root),
    totalPaintTimeMs: sumPaint(root),
    capturedAt: new Date().toISOString(),
  };
}

function countNodes(node: RenderNode): number {
  return 1 + node.children.reduce((s, c) => s + countNodes(c), 0);
}
function sumLayout(node: RenderNode): number {
  return node.layoutTimeMs + node.children.reduce((s, c) => s + sumLayout(c), 0);
}
function sumPaint(node: RenderNode): number {
  return node.paintTimeMs + node.children.reduce((s, c) => s + sumPaint(c), 0);
}
