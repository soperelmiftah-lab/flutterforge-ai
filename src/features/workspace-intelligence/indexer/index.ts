/**
 * @module features/workspace-intelligence/indexer
 *
 * Project Indexer — takes a ScanResult and builds the structured project
 * index: files (with symbols/imports/exports), folders, and the project
 * knowledge base. This is the canonical "what the AI knows about the project"
 * data structure.
 */

import type {
  WorkspaceFile,
  WorkspaceFolder,
  ProjectKnowledgeBase,
  ProjectKind,
  SymbolRef,
  ProjectStatistics,
} from "@/features/workspace-intelligence/types";
import type { ScanResult, ScannedFile } from "../scanner";
import { parseSymbols, parseImports, parseExports } from "../symbols";
import { estimateTokens } from "@/features/ai/tokens/counter";
import {
  detectStateManagement,
  detectRouting,
  summariseExpertise,
  groupSymbolsByKind,
} from "../knowledge";

/** Language inferred from a file extension. */
function languageForExt(ext: string): string {
  switch (ext) {
    case "dart": return "dart";
    case "yaml":
    case "yml": return "yaml";
    case "md": return "markdown";
    case "json": return "json";
    case "js":
    case "mjs": return "javascript";
    case "ts": return "typescript";
    case "html":
    case "xml": return "xml";
    case "css": return "css";
    case "gradle":
    case "kts": return "gradle";
    case "swift": return "swift";
    case "kt": return "kotlin";
    case "java": return "java";
    case "plist": return "plist";
    default: return "text";
  }
}

/** Index a single scanned file into a WorkspaceFile. */
export function indexFile(file: ScannedFile): WorkspaceFile {
  const symbols: SymbolRef[] = file.extension === "dart"
    ? parseSymbols(file.content, file.path)
    : [];
  const imports = file.extension === "dart" ? parseImports(file.content) : [];
  const exports = file.extension === "dart" ? parseExports(file.content) : [];

  return {
    path: file.path,
    name: file.name,
    extension: file.extension,
    language: languageForExt(file.extension),
    size: file.size,
    lines: file.lines,
    tokenEstimate: estimateTokens(file.content),
    symbols,
    imports,
    exports,
  };
}

/** Index all folders from a scan result. */
export function indexFolders(scan: ScanResult): WorkspaceFolder[] {
  return scan.folders.map((path) => {
    const parts = path.split("/");
    const name = parts[parts.length - 1] || path;
    const depth = parts.length - 1;
    const filesInFolder = scan.files.filter((f) => f.path.startsWith(path + "/")).length;
    const subFolders = scan.folders.filter((f) => f.startsWith(path + "/") && !f.slice(path.length + 1).includes("/")).length;
    return {
      path,
      name,
      fileCount: filesInFolder,
      folderCount: subFolders,
      depth,
    };
  });
}

/** Determine the project kind from the scan. */
export function detectProjectKind(scan: ScanResult): ProjectKind {
  if (!scan.pubspec) return "unknown";
  const deps = scan.pubspec.dependencies;
  if (deps["flutter"]) {
    if (scan.platforms.web && !scan.platforms.android && !scan.platforms.ios) return "flutter-web";
    return "flutter";
  }
  return "dart-package";
}

/** Build the project knowledge base from a scan + indexed files. */
export function buildKnowledgeBase(
  scan: ScanResult,
  files: WorkspaceFile[]
): ProjectKnowledgeBase {
  const allSymbols = files.flatMap((f) => f.symbols);
  const expertise = summariseExpertise(allSymbols);
  const stateManagement = detectStateManagement(scan.pubspec);
  const routing = detectRouting(scan.pubspec);
  const kind = detectProjectKind(scan);

  // Top symbols: prefer widgets, then classes, sorted by symbol count.
  const topSymbols = allSymbols
    .filter((s) => s.kind === "widget" || s.kind === "class" || s.kind === "provider")
    .slice(0, 50);

  // Top files: by token estimate (most content-rich).
  const topFiles = [...files]
    .sort((a, b) => b.tokenEstimate - a.tokenEstimate)
    .slice(0, 20);

  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  const totalTokens = files.reduce((sum, f) => sum + f.tokenEstimate, 0);

  return {
    kind,
    name: scan.pubspec?.name ?? "unknown",
    pubspec: scan.pubspec,
    analysisOptions: scan.analysisOptions,
    platforms: scan.platforms,
    stateManagement,
    routing,
    fileCount: files.length,
    folderCount: scan.folders.length,
    symbolCount: allSymbols.length,
    totalLines,
    totalTokens,
    topSymbols,
    topFiles,
    dependencies: scan.pubspec ? Object.keys(scan.pubspec.dependencies) : [],
    devDependencies: scan.pubspec ? Object.keys(scan.pubspec.devDependencies) : [],
    assets: scan.assets,
    builtAt: new Date().toISOString(),
  };
}

/** Compute project statistics for display. */
export function computeStatistics(files: WorkspaceFile[]): ProjectStatistics {
  const filesByType: Record<string, number> = {};
  const symbolsByKind: Record<string, number> = {};
  const linesByLanguage: Record<string, number> = {};
  const importCount = new Map<string, number>();

  for (const f of files) {
    filesByType[f.extension] = (filesByType[f.extension] ?? 0) + 1;
    linesByLanguage[f.language] = (linesByLanguage[f.language] ?? 0) + f.lines;
    for (const s of f.symbols) {
      symbolsByKind[s.kind] = (symbolsByKind[s.kind] ?? 0) + 1;
    }
    for (const imp of f.imports) {
      if (imp.relative) {
        importCount.set(imp.uri, (importCount.get(imp.uri) ?? 0) + 1);
      }
    }
  }

  const largestFiles = [...files].sort((a, b) => b.size - a.size).slice(0, 10);
  const mostImportedFiles = Array.from(importCount.entries())
    .map(([path, count]) => ({ path, importCount: count }))
    .sort((a, b) => b.importCount - a.importCount)
    .slice(0, 10);

  const totalLines = files.reduce((sum, f) => sum + f.lines, 0);
  const totalTokens = files.reduce((sum, f) => sum + f.tokenEstimate, 0);

  return {
    filesByType,
    symbolsByKind: symbolsByKind as ProjectStatistics["symbolsByKind"],
    linesByLanguage,
    largestFiles,
    mostImportedFiles,
    totalFiles: files.length,
    totalSymbols: files.reduce((s, f) => s + f.symbols.length, 0),
    totalLines,
    totalTokens,
    averageFileSize: files.length ? Math.round(totalLines / files.length) : 0,
  };
}

/** The complete project index. */
export interface ProjectIndex {
  root: string;
  files: WorkspaceFile[];
  folders: WorkspaceFolder[];
  knowledgeBase: ProjectKnowledgeBase;
  statistics: ProjectStatistics;
  builtAt: string;
}

/** Build a full project index from a scan result. */
export async function buildIndex(scan: ScanResult): Promise<ProjectIndex> {
  const files = scan.files.map(indexFile);
  const folders = indexFolders(scan);
  const knowledgeBase = buildKnowledgeBase(scan, files);
  const statistics = computeStatistics(files);

  return {
    root: scan.root,
    files,
    folders,
    knowledgeBase,
    statistics,
    builtAt: new Date().toISOString(),
  };
}

export { groupSymbolsByKind };
