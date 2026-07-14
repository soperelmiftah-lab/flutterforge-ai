/** Widget Tree Engine */
import type { WidgetTree, WidgetNode } from "../types";
import { uid } from "@/lib/utils";
export function buildTree(root: WidgetNode): WidgetTree { return { id: uid("tree"), root, nodeCount: countNodes(root), maxDepth: getDepth(root), validated: false, optimized: false, warnings: [] }; }
function countNodes(n: WidgetNode): number { return 1 + n.children.reduce((s, c) => s + countNodes(c), 0); }
function getDepth(n: WidgetNode): number { return n.children.length === 0 ? 1 : 1 + Math.max(...n.children.map(getDepth)); }
export function validateTree(tree: WidgetTree): string[] { const w: string[] = []; validateNode(tree.root, w, 0); tree.warnings = w; tree.validated = w.length === 0; return w; }
function validateNode(n: WidgetNode, w: string[], d: number): void { if (d > 10) w.push(`Deep nesting at ${n.type} (depth ${d})`); if (n.children.length > 20) w.push(`${n.type} has ${n.children.length} children`); n.children.forEach(c => validateNode(c, w, d + 1)); }
export function optimizeTree(tree: WidgetTree): WidgetTree { const o = { ...tree, root: { ...tree.root } }; optimizeNode(o.root); o.optimized = true; o.nodeCount = countNodes(o.root); return o; }
function optimizeNode(n: WidgetNode): WidgetNode { if (n.children.length === 0) n.canBeConst = true; n.children = n.children.map(optimizeNode); return n; }
export function generateDart(tree: WidgetTree, className = "GeneratedWidget"): string { return `import 'package:flutter/material.dart';\n\nclass ${className} extends StatelessWidget {\n  const ${className}({super.key});\n\n  @override\n  Widget build(BuildContext context) {\n    return ${buildCode(tree.root, 1)};\n  }\n}\n`; }
function buildCode(n: WidgetNode, indent: number): string { const pad = "  ".repeat(indent + 1); if (n.children.length === 0) return `${n.canBeConst ? "const " : ""}${n.type}()`; const children = n.children.map(c => `${pad}${buildCode(c, indent + 1)},`).join("\n"); return `${n.type}(\n${pad}children: [\n${children}\n${pad}],\n${"  ".repeat(indent)})`; }
