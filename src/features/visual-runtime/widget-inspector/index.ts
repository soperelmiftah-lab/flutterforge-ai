/**
 * @module features/visual-runtime/widget-inspector
 *
 * Widget Inspector — exposes the live widget hierarchy with parent/child
 * relationships, properties, keys, and state.
 */

import type { WidgetTree, WidgetTreeNode } from "../types";
import { uid } from "@/lib/utils";

/** Capture the current widget tree (mock — would use Flutter DevTools Service Protocol). */
export function captureWidgetTree(): WidgetTree {
  const root = buildMockTree();
  const totalNodes = countNodes(root);
  const maxDepth = getDepth(root);
  return {
    root,
    totalNodes,
    maxDepth,
    capturedAt: new Date().toISOString(),
  };
}

function buildMockTree(): WidgetTreeNode {
  return {
    id: uid("w"),
    type: "MaterialApp",
    key: "material_app",
    properties: { title: "Forge Demo", debugShowCheckedModeBanner: false },
    isVisible: true,
    isFocused: false,
    depth: 0,
    children: [
      {
        id: uid("w"),
        type: "Scaffold",
        properties: { appBar: "AppBar(title: Text('Home'))" },
        isVisible: true,
        isFocused: false,
        depth: 1,
        children: [
          {
            id: uid("w"),
            type: "AppBar",
            properties: { title: "Text('Home')" },
            isVisible: true,
            isFocused: false,
            depth: 2,
            children: [],
          },
          {
            id: uid("w"),
            type: "Center",
            properties: {},
            isVisible: true,
            isFocused: true,
            depth: 2,
            children: [
              {
                id: uid("w"),
                type: "Column",
                properties: { mainAxisAlignment: "center" },
                isVisible: true,
                isFocused: false,
                depth: 3,
                children: [
                  { id: uid("w"), type: "Text", properties: { data: "Welcome" }, isVisible: true, isFocused: false, depth: 4, children: [] },
                  { id: uid("w"), type: "ElevatedButton", properties: { onPressed: "()", child: "Text('Click')" }, isVisible: true, isFocused: false, depth: 4, children: [] },
                ],
              },
            ],
          },
          {
            id: uid("w"),
            type: "FloatingActionButton",
            properties: { onPressed: "()", child: "Icon(Icons.add)" },
            isVisible: true,
            isFocused: false,
            depth: 2,
            children: [],
          },
        ],
      },
    ],
  };
}

function countNodes(node: WidgetTreeNode): number {
  return 1 + node.children.reduce((sum, c) => sum + countNodes(c), 0);
}

function getDepth(node: WidgetTreeNode): number {
  if (node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(getDepth));
}
