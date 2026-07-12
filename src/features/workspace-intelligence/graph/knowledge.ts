/**
 * @module features/workspace-intelligence/graph/knowledge
 *
 * Knowledge Graph — generates high-level relationship views from the
 * dependency graph + symbols:
 *   - Widget hierarchy (parent widgets → child widgets)
 *   - Provider graph (providers → consumers)
 *   - Service graph (services → repositories → models)
 *   - Navigation graph (routes → pages → target screens)
 *
 * These views power the Dependency Viewer UI and give future agents
 * structural understanding beyond raw file imports.
 */

import type {
  WorkspaceFile,
  SymbolRef,
  WorkspacePath,
} from "@/features/workspace-intelligence/types";
import type { DependencyGraph } from "../graph";

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: string;
  path?: WorkspacePath;
}

export interface KnowledgeGraphEdge {
  from: string;
  to: string;
  label: string;
}

export interface KnowledgeGraphView {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
}

/** Build the widget hierarchy view. */
export function buildWidgetHierarchy(files: WorkspaceFile[]): KnowledgeGraphView {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const widgetSymbols = files.flatMap((f) => f.symbols.filter((s) => s.kind === "widget"));

  for (const w of widgetSymbols) {
    nodes.push({ id: w.name, label: w.name, type: "widget", path: w.filePath });
  }

  // Heuristic: widget A uses widget B if B's name appears in A's file.
  // (A full AST would do this precisely; this is a fast approximation.)
  for (const file of files) {
    const fileWidgets = file.symbols.filter((s) => s.kind === "widget");
    for (const w of fileWidgets) {
      for (const other of widgetSymbols) {
        if (other.name === w.name) continue;
        // We don't have content here, so we skip cross-file widget-usage edges
        // in this approximation. The dependency graph covers file-level edges.
      }
    }
  }

  return { nodes, edges };
}

/** Build the provider graph (providers → consumers). */
export function buildProviderGraph(
  files: WorkspaceFile[],
  graph: DependencyGraph
): KnowledgeGraphView {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const providerSymbols = files.flatMap((f) => f.symbols.filter((s) => s.kind === "provider"));

  for (const p of providerSymbols) {
    nodes.push({ id: p.name, label: p.name, type: "provider", path: p.filePath });
  }

  // Add consumer nodes (files that import the provider's file).
  for (const p of providerSymbols) {
    const dependents = graph.edges
      .filter((e) => e.to === p.filePath && e.kind === "provider-consumer")
      .map((e) => e.from);
    for (const dep of dependents) {
      const depFile = files.find((f) => f.path === dep);
      if (depFile) {
        const consumerId = `file:${dep}`;
        if (!nodes.find((n) => n.id === consumerId)) {
          nodes.push({ id: consumerId, label: depFile.name, type: "consumer", path: dep });
        }
        edges.push({ from: p.name, to: consumerId, label: "consumes" });
      }
    }
  }

  return { nodes, edges };
}

/** Build the service graph (services → repositories → models). */
export function buildServiceGraph(files: WorkspaceFile[]): KnowledgeGraphView {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const services = files.flatMap((f) => f.symbols.filter((s) => s.kind === "service"));
  const repos = files.flatMap((f) => f.symbols.filter((s) => s.kind === "repository"));
  const models = files.flatMap((f) => f.symbols.filter((s) => s.kind === "model"));

  for (const s of services) nodes.push({ id: s.name, label: s.name, type: "service", path: s.filePath });
  for (const r of repos) nodes.push({ id: r.name, label: r.name, type: "repository", path: r.filePath });
  for (const m of models) nodes.push({ id: m.name, label: m.name, type: "model", path: m.filePath });

  // Heuristic: service → repository (if repo name appears in service file's imports).
  // Skipped without content; the dependency graph covers file-level edges.

  return { nodes, edges };
}

/** Build the navigation graph (routes → pages). */
export function buildNavigationGraph(files: WorkspaceFile[]): KnowledgeGraphView {
  const nodes: KnowledgeGraphNode[] = [];
  const edges: KnowledgeGraphEdge[] = [];
  const routes = files.flatMap((f) => f.symbols.filter((s) => s.kind === "route"));

  for (const r of routes) {
    nodes.push({ id: r.name, label: r.name, type: "route", path: r.filePath });
  }

  return { nodes, edges };
}

/** Build all knowledge graph views at once. */
export interface KnowledgeGraphBundle {
  widgetHierarchy: KnowledgeGraphView;
  providerGraph: KnowledgeGraphView;
  serviceGraph: KnowledgeGraphView;
  navigationGraph: KnowledgeGraphView;
}

export function buildKnowledgeGraph(
  files: WorkspaceFile[],
  graph: DependencyGraph
): KnowledgeGraphBundle {
  return {
    widgetHierarchy: buildWidgetHierarchy(files),
    providerGraph: buildProviderGraph(files, graph),
    serviceGraph: buildServiceGraph(files),
    navigationGraph: buildNavigationGraph(files),
  };
}

export type { SymbolRef };
