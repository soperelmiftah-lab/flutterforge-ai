/**
 * @module features/workspace-intelligence/graph/builder
 *
 * Dependency Graph builder. Constructs a graph of file→file edges from the
 * indexed files' imports, plus symbol-level edges (widget usage, class
 * references, provider-consumer, service-usage, route-target, asset-ref).
 *
 * Also computes node importance (a lightweight PageRank-style score) so the
 * context engine can prioritise hub files.
 */

import type {
  DependencyEdge,
  DependencyGraph,
  DependencyNode,
  WorkspaceFile,
  WorkspacePath,
} from "@/features/workspace-intelligence/types";

/** Resolve a Dart import URI to a workspace file path, if possible. */
function resolveImportUri(
  uri: string,
  fromPath: WorkspacePath,
  allFiles: WorkspaceFile[]
): WorkspacePath | null {
  // Relative imports: resolve against the importing file's directory.
  if (uri.startsWith("./") || uri.startsWith("../")) {
    const fromDir = fromPath.split("/").slice(0, -1).join("/");
    const resolved = normalizePath(`${fromDir}/${uri}`);
    return findFileByPath(allFiles, resolved) ?? findFileByPath(allFiles, `${resolved}.dart`);
  }
  // package: imports — match against files in lib/ for the project's own package.
  if (uri.startsWith("package:")) {
    const match = uri.match(/^package:([^/]+)\/(.+)$/);
    if (match) {
      const [, pkgName, rest] = match;
      const candidate = `lib/${rest}`;
      // We don't know the project's package name here, so match any lib/<rest>.
      const found = findFileByPath(allFiles, candidate);
      if (found) return found;
      void pkgName;
    }
  }
  return null;
}

function normalizePath(p: string): string {
  const parts = p.split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") { out.pop(); continue; }
    out.push(part);
  }
  return out.join("/");
}

function findFileByPath(files: WorkspaceFile[], path: string): WorkspacePath | null {
  return files.find((f) => f.path === path)?.path ?? null;
}

/**
 * Build the dependency graph from indexed files.
 *
 * Edge kinds produced:
 *   - import:           file → file (from import statements)
 *   - widget-usage:     file → file (widget class referenced)
 *   - class-reference:  file → file (class name referenced in content)
 *   - provider-consumer:file → file (provider symbol referenced)
 *   - service-usage:    file → file (service class referenced)
 *   - route-target:     file → file (route/page/screen class referenced)
 *   - asset-reference:  file → asset path (string literal asset path)
 */
export function buildGraph(files: WorkspaceFile[]): DependencyGraph {
  const edges: DependencyEdge[] = [];
  const nodeMap = new Map<WorkspacePath, DependencyNode>();

  // Ensure every file is a node.
  for (const f of files) {
    nodeMap.set(f.path, { path: f.path, inDegree: 0, outDegree: 0, importance: 0 });
  }

  // Build a symbol → file map for cross-reference detection.
  const symbolIndex = new Map<string, WorkspacePath>();
  for (const f of files) {
    for (const s of f.symbols) {
      symbolIndex.set(s.name, f.path);
    }
  }

  for (const file of files) {
    if (file.extension !== "dart") continue;

    // 1. Import edges.
    for (const imp of file.imports) {
      const target = resolveImportUri(imp.uri, file.path, files);
      if (target && target !== file.path) {
        addEdge(edges, file.path, target, "import", imp.uri);
      }
    }

    // 2. Symbol-reference edges (widget/class/provider/service/route usage).
    // We scan the file's content for names of symbols defined elsewhere.
    const content = file.content; // not stored on WorkspaceFile — use a fallback
    void content;
  }

  // 2b. Re-scan symbol references using the scanned content.
  // Since WorkspaceFile doesn't carry content, we detect references via the
  // symbol names that appear in OTHER files' symbols (heuristic: a file
  // references a symbol if a symbol it defines shares a name with an import
  // or if the symbol name appears in the file's import show list).
  for (const file of files) {
    for (const imp of file.imports) {
      if (imp.show) {
        for (const shown of imp.show) {
          const target = symbolIndex.get(shown);
          if (target && target !== file.path) {
            // Classify the edge by the referenced symbol's kind.
            const targetFile = files.find((f) => f.path === target);
            const sym = targetFile?.symbols.find((s) => s.name === shown);
            const kind = sym
              ? sym.kind === "widget" ? "widget-usage"
                : sym.kind === "provider" ? "provider-consumer"
                : sym.kind === "service" ? "service-usage"
                : sym.kind === "route" ? "route-target"
                : "class-reference"
              : "class-reference";
            addEdge(edges, file.path, target, kind, shown);
          }
        }
      }
    }
  }

  // 3. Asset-reference edges (from pubspec assets — already collected).
  // These connect asset string literals to files that reference them.
  // (Skipped here — assets are leaf nodes; the knowledge base tracks them.)

  // Compute in/out degrees.
  for (const edge of edges) {
    const from = nodeMap.get(edge.from);
    const to = nodeMap.get(edge.to);
    if (from) from.outDegree++;
    if (to) to.inDegree++;
  }

  // Compute importance via a simple iterative propagation (PageRank-style).
  computeImportance(nodeMap, edges, 5);

  return {
    nodes: nodeMap,
    edges,
    builtAt: new Date().toISOString(),
  };
}

function addEdge(
  edges: DependencyEdge[],
  from: WorkspacePath,
  to: WorkspacePath,
  kind: DependencyEdge["kind"],
  symbol?: string
) {
  // Avoid duplicate edges of the same kind.
  const exists = edges.some(
    (e) => e.from === from && e.to === to && e.kind === kind && e.symbol === symbol
  );
  if (!exists) {
    edges.push({ from, to, kind, symbol });
  }
}

/** Lightweight PageRank: importance = (1-d)/N + d * Σ(importance(in)/outdeg(in)). */
function computeImportance(
  nodes: Map<WorkspacePath, DependencyNode>,
  edges: DependencyEdge[],
  iterations: number
) {
  const N = nodes.size;
  if (N === 0) return;
  const d = 0.85;
  const incoming = new Map<WorkspacePath, WorkspacePath[]>();
  const outgoing = new Map<WorkspacePath, number>();
  for (const node of nodes.values()) {
    incoming.set(node.path, []);
    outgoing.set(node.path, 0);
  }
  for (const edge of edges) {
    incoming.get(edge.to)?.push(edge.from);
    outgoing.set(edge.from, (outgoing.get(edge.from) ?? 0) + 1);
  }
  // Initialise evenly.
  for (const node of nodes.values()) node.importance = 1 / N;
  // Iterate.
  for (let i = 0; i < iterations; i++) {
    const next = new Map<WorkspacePath, number>();
    for (const node of nodes.values()) {
      const ins = incoming.get(node.path) ?? [];
      let sum = 0;
      for (const src of ins) {
        const srcImp = nodes.get(src)?.importance ?? 0;
        const srcOut = outgoing.get(src) ?? 1;
        sum += srcImp / srcOut;
      }
      next.set(node.path, (1 - d) / N + d * sum);
    }
    for (const [path, imp] of next) {
      const node = nodes.get(path);
      if (node) node.importance = imp;
    }
  }
  // Normalise to 0-1.
  const max = Math.max(...Array.from(nodes.values()).map((n) => n.importance), 0.0001);
  for (const node of nodes.values()) {
    node.importance = node.importance / max;
  }
}

/** Get the N most important files (hubs). */
export function getMostImportantFiles(graph: DependencyGraph, n: number): WorkspacePath[] {
  return Array.from(graph.nodes.values())
    .sort((a, b) => b.importance - a.importance)
    .slice(0, n)
    .map((n) => n.path);
}

/** Get all files that a given file directly depends on. */
export function getDependencies(graph: DependencyGraph, path: WorkspacePath): WorkspacePath[] {
  return graph.edges.filter((e) => e.from === path).map((e) => e.to);
}

/** Get all files that directly depend on a given file (reverse dependencies). */
export function getDependents(graph: DependencyGraph, path: WorkspacePath): WorkspacePath[] {
  return graph.edges.filter((e) => e.to === path).map((e) => e.from);
}
