import { NextRequest, NextResponse } from "next/server";
import { buildTree, validateTree, generateDart } from "@/features/flutter-platform/widget-tree";
import type { WidgetNode } from "@/features/flutter-platform/types";
import { uid } from "@/lib/utils";

/**
 * POST /api/v1/flutter/widget-tree
 *
 * Build a widget tree from a root node (provided in the body), or generate
 * a default demo tree if no root is provided. Returns the tree, validation
 * warnings, and generated Dart code.
 *
 * Body: { root?: WidgetNode, generateDart?: boolean, className?: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const root: WidgetNode = body.root ?? defaultTree();
  const className = (body.className as string) ?? "GeneratedWidget";

  try {
    const tree = buildTree(root);
    const warnings = validateTree(tree);
    const dart = body.generateDart === false ? undefined : generateDart(tree, className);
    void uid; // ensure uid is referenced (used inside widget-tree module)
    return NextResponse.json({
      data: { ...tree, warnings, generatedDart: dart },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        error: {
          code: "WIDGET_TREE_FAILED",
          message: e instanceof Error ? e.message : "Generation failed",
        },
      },
      { status: 500 }
    );
  }
}

/** Build a small default demo tree. */
function defaultTree(): WidgetNode {
  return {
    id: "n1",
    type: "Scaffold",
    category: "material",
    properties: { appBar: "AppBar(title: Text('Demo'))" },
    children: [
      {
        id: "n2",
        type: "Center",
        category: "layout",
        properties: {},
        children: [
          {
            id: "n3",
            type: "Column",
            category: "layout",
            properties: { mainAxisAlignment: "center" },
            children: [
              { id: "n4", type: "Text", category: "visual", properties: { 'data': 'Hello' }, children: [], canBeConst: true, rebuildCost: 0.2 },
              { id: "n5", type: "ElevatedButton", category: "input", properties: { onPressed: "() {}" }, children: [], canBeConst: false, rebuildCost: 0.4 },
            ],
            canBeConst: false,
            rebuildCost: 0.5,
          },
        ],
        canBeConst: false,
        rebuildCost: 0.3,
      },
    ],
    canBeConst: false,
    rebuildCost: 0.6,
  };
}
