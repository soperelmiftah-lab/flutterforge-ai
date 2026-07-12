/**
 * @module features/workspace-intelligence/types
 *
 * Core domain types for the Workspace Intelligence layer. These define the
 * universal vocabulary used by the scanner, indexer, dependency graph,
 * search engine, context engine, and the API/UI layers.
 *
 * Every future AI Agent imports these types to understand a Flutter project
 * — they are the contract between "files on disk" and "what the AI knows".
 */

/** A path within the workspace, forward-slash separated, relative to project root. */
export type WorkspacePath = string;

/** Canonical project kind. */
export type ProjectKind = "flutter" | "dart-package" | "flutter-web" | "unknown";

/** Detected state-management approach in the project. */
export type StateManagementKind =
  | "riverpod"
  | "bloc"
  | "cubit"
  | "provider"
  | "getx"
  | "none";

/** Detected routing approach. */
export type RoutingKind = "go_router" | "auto_route" | "navigator" | "none";

/** A scanned platform folder presence flag. */
export interface PlatformPresence {
  android: boolean;
  ios: boolean;
  web: boolean;
  windows: boolean;
  linux: boolean;
  macos: boolean;
}

/** Parsed pubspec.yaml descriptor. */
export interface PubspecInfo {
  name: string;
  description?: string;
  version?: string;
  environment?: { sdk?: string; flutter?: string };
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  flutter?: {
    usesMaterialDesign?: boolean;
    assets?: string[];
    fonts?: Array<{ family: string; fonts: Array<{ asset: string; weight?: number }> }>;
  };
}

/** Parsed analysis_options.yaml descriptor. */
export interface AnalysisOptionsInfo {
  include?: string;
  linter?: { rules?: string[] };
  analyzer?: { exclude?: string[]; strong_mode?: Record<string, unknown> };
}

/** A file in the workspace index. */
export interface WorkspaceFile {
  path: WorkspacePath;
  name: string;
  extension: string;
  language: string;
  size: number;
  lines: number;
  /** Token estimate for the file's content. */
  tokenEstimate: number;
  /** Last modified ISO date. */
  modifiedAt?: string;
  /** Whether the file is pinned by the user. */
  pinned?: boolean;
  /** Top-level symbols discovered in the file. */
  symbols: SymbolRef[];
  /** Imports declared in the file. */
  imports: ImportRef[];
  /** Exports declared in the file. */
  exports: ExportRef[];
}

/** A folder in the workspace index. */
export interface WorkspaceFolder {
  path: WorkspacePath;
  name: string;
  fileCount: number;
  folderCount: number;
  /** Depth from project root (0 = root). */
  depth: number;
}

/** Symbol kinds recognised by the symbol engine. */
export type SymbolKind =
  | "class"
  | "widget"
  | "function"
  | "method"
  | "enum"
  | "mixin"
  | "extension"
  | "typedef"
  | "provider"
  | "route"
  | "service"
  | "repository"
  | "model"
  | "theme"
  | "constant"
  | "variable";

/** A reference to a symbol discovered in a file. */
export interface SymbolRef {
  name: string;
  kind: SymbolKind;
  /** Line where the symbol is declared (1-based). */
  line: number;
  /** End line if known. */
  endLine?: number;
  /** For widgets: the Flutter widget archetype. */
  widgetArchetype?: WidgetArchetype;
  /** Modifiers (static, abstract, const, async). */
  modifiers: string[];
  /** Doc comment, if any (trimmed). */
  doc?: string;
  /** Source file path. */
  filePath: WorkspacePath;
}

/** Flutter widget archetypes. */
export type WidgetArchetype =
  | "StatelessWidget"
  | "StatefulWidget"
  | "HookWidget"
  | "ConsumerWidget"
  | "ConsumerStatefulWidget"
  | "HookConsumerWidget"
  | "InheritedWidget"
  | "CustomPainter"
  | "CustomClipper"
  | "Other";

/** An import declaration. */
export interface ImportRef {
  /** The import URI, e.g. "package:flutter/material.dart" or "dart:async". */
  uri: string;
  /** Alias if `as` was used. */
  alias?: string;
  /** Show combinators. */
  show?: string[];
  /** Hide combinators. */
  hide?: string[];
  /** Whether this is a relative import. */
  relative: boolean;
}

/** An export declaration. */
export interface ExportRef {
  uri: string;
  show?: string[];
  hide?: string[];
  relative: boolean;
}

/** An edge in the dependency graph. */
export interface DependencyEdge {
  from: WorkspacePath;
  to: WorkspacePath;
  /** Why the edge exists. */
  kind: "import" | "widget-usage" | "class-reference" | "provider-consumer" | "service-usage" | "route-target" | "asset-reference";
  /** Optional symbol that triggered the edge. */
  symbol?: string;
}

/** A node in the dependency graph. */
export interface DependencyNode {
  path: WorkspacePath;
  /** Number of incoming edges (files that depend on this one). */
  inDegree: number;
  /** Number of outgoing edges (files this one depends on). */
  outDegree: number;
  /** Page-rank-style importance score (0-1). */
  importance: number;
}

/** The full dependency graph. */
export interface DependencyGraph {
  nodes: Map<WorkspacePath, DependencyNode>;
  edges: DependencyEdge[];
  /** Built-at timestamp. */
  builtAt: string;
}

/** A search result item. */
export interface SearchResult {
  path: WorkspacePath;
  name: string;
  kind: "file" | "symbol" | "import" | "route" | "asset" | "comment";
  /** Matched symbol, if any. */
  symbol?: SymbolRef;
  /** Matched line content, for text matches. */
  snippet?: string;
  line?: number;
  /** Relevance score (0-1, higher = more relevant). */
  score: number;
  /** Why this matched (for display). */
  matchedFields: string[];
}

/** Search query options. */
export interface SearchQuery {
  query: string;
  /** Restrict to these symbol kinds. */
  kinds?: SymbolKind[];
  /** Restrict to these file extensions. */
  extensions?: string[];
  /** Maximum results. */
  limit?: number;
  /** Whether to include comment/doc matches. */
  includeComments?: boolean;
}

/** A file ranked by relevance to a user request. */
export interface RankedFile {
  path: WorkspacePath;
  name: string;
  /** Relevance score (0-1). */
  score: number;
  /** Why this file is relevant. */
  reasons: string[];
  /** Token estimate for including this file. */
  tokenEstimate: number;
}

/** Context assembly result. */
export interface ContextResult {
  /** Files to include in the AI context, ranked. */
  files: RankedFile[];
  /** Total estimated tokens for the included files. */
  totalTokens: number;
  /** Model context window. */
  contextLength: number;
  /** Usage percentage. */
  usagePercent: number;
  /** Files that were trimmed to fit. */
  trimmed: WorkspacePath[];
}

/** Workspace memory — what the user is currently doing. */
export interface WorkspaceMemory {
  currentProjectId: string | null;
  currentFilePath: WorkspacePath | null;
  cursor: { line: number; column: number } | null;
  openTabs: WorkspacePath[];
  recentFiles: WorkspacePath[];
  pinnedFiles: WorkspacePath[];
  recentSearches: string[];
}

/** Project knowledge base — the compiled intelligence about a project. */
export interface ProjectKnowledgeBase {
  kind: ProjectKind;
  name: string;
  pubspec: PubspecInfo | null;
  analysisOptions: AnalysisOptionsInfo | null;
  platforms: PlatformPresence;
  stateManagement: StateManagementKind;
  routing: RoutingKind;
  fileCount: number;
  folderCount: number;
  symbolCount: number;
  totalLines: number;
  totalTokens: number;
  topSymbols: SymbolRef[];
  topFiles: WorkspaceFile[];
  dependencies: string[];
  devDependencies: string[];
  assets: string[];
  builtAt: string;
}

/** A file-change event from the watcher. */
export interface FileChangeEvent {
  type: "create" | "delete" | "rename" | "modify" | "move";
  path: WorkspacePath;
  oldPath?: WorkspacePath;
  timestamp: string;
}

/** Project statistics for display. */
export interface ProjectStatistics {
  filesByType: Record<string, number>;
  symbolsByKind: Record<SymbolKind, number>;
  linesByLanguage: Record<string, number>;
  largestFiles: WorkspaceFile[];
  mostImportedFiles: Array<{ path: WorkspacePath; importCount: number }>;
  totalFiles: number;
  totalSymbols: number;
  totalLines: number;
  totalTokens: number;
  averageFileSize: number;
}
