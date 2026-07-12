/**
 * @module features/workspace-intelligence/context/engine
 *
 * Context Engine — given a user request (chat message, agent task), finds
 * only the relevant files and ranks them by relevance. NEVER sends the
 * entire project. Supports Top 5 / Top 10 / Top 20 selection.
 *
 * The token optimizer trims the selection to fit the model's context window,
 * always keeping: pinned files, the current file, related imports, and direct
 * dependencies.
 */

import type {
  WorkspaceFile,
  WorkspacePath,
  RankedFile,
  ContextResult,
} from "@/features/workspace-intelligence/types";
import type { DependencyGraph } from "../graph";
import { search } from "../search";
import { estimateTokens } from "@/features/ai/tokens/counter";

export interface ContextRequest {
  /** The user's natural-language request. */
  query: string;
  /** Maximum number of files to include (Top N). */
  topN?: 5 | 10 | 20;
  /** The currently open file (always included if provided). */
  currentFile?: WorkspacePath;
  /** User-pinned files (always included). */
  pinnedFiles?: WorkspacePath[];
  /** Model context window (for token budgeting). */
  contextLength: number;
  /** Token budget reserved for the prompt + response (default 4096). */
  reservedTokens?: number;
}

/**
 * Assemble the context for a user request.
 *
 * Pipeline:
 *   1. Search the project index for files relevant to the query.
 *   2. Always include pinned files + the current file.
 *   3. Add direct imports of the current file.
 *   4. Add direct dependencies from the graph.
 *   5. Trim to fit the token budget (token optimizer).
 */
export function assembleContext(
  files: WorkspaceFile[],
  graph: DependencyGraph | null,
  request: ContextRequest
): ContextResult {
  const topN = request.topN ?? 10;
  const reservedTokens = request.reservedTokens ?? 4096;
  const tokenBudget = request.contextLength - reservedTokens;

  const ranked: RankedFile[] = [];
  const included = new Set<WorkspacePath>();
  const reasons = new Map<WorkspacePath, string[]>();

  const addFile = (file: WorkspaceFile, score: number, reason: string) => {
    if (included.has(file.path)) {
      reasons.get(file.path)?.push(reason);
      return;
    }
    included.add(file.path);
    ranked.push({
      path: file.path,
      name: file.name,
      score,
      reasons: [reason],
      tokenEstimate: file.tokenEstimate,
    });
    reasons.set(file.path, [reason]);
  };

  // 1. Pinned files — always included, max score.
  for (const pinnedPath of request.pinnedFiles ?? []) {
    const file = files.find((f) => f.path === pinnedPath);
    if (file) addFile(file, 1.0, "pinned");
  }

  // 2. Current file — always included.
  if (request.currentFile) {
    const file = files.find((f) => f.path === request.currentFile);
    if (file) addFile(file, 0.95, "current file");
  }

  // 3. Search results for the query.
  if (request.query.trim()) {
    const results = search(files, graph, {
      query: request.query,
      limit: topN * 3, // over-fetch so we have options after dedup
    });
    for (const result of results) {
      const file = files.find((f) => f.path === result.path);
      if (file) addFile(file, result.score, `search match (${result.matchedFields.join(", ")})`);
    }
  }

  // 4. Direct imports of the current file.
  if (request.currentFile) {
    const currentFile = files.find((f) => f.path === request.currentFile);
    if (currentFile) {
      for (const imp of currentFile.imports) {
        const target = resolveRelativeImport(imp.uri, currentFile.path);
        const file = files.find((f) => f.path === target);
        if (file) addFile(file, 0.7, "import of current file");
      }
    }
  }

  // 5. Direct dependencies from the graph (files the current file depends on).
  if (graph && request.currentFile) {
    const deps = graph.edges
      .filter((e) => e.from === request.currentFile)
      .map((e) => e.to);
    for (const dep of deps) {
      const file = files.find((f) => f.path === dep);
      if (file) addFile(file, 0.65, "graph dependency");
    }
  }

  // Sort by score descending.
  ranked.sort((a, b) => b.score - a.score);

  // 6. Token optimizer — trim to fit the budget.
  const trimmed: WorkspacePath[] = [];
  let totalTokens = 0;
  const finalFiles: RankedFile[] = [];

  for (const ranked_file of ranked) {
    if (finalFiles.length >= topN) {
      trimmed.push(ranked_file.path);
      continue;
    }
    if (totalTokens + ranked_file.tokenEstimate > tokenBudget) {
      // Pinned + current files are never trimmed.
      const file = ranked_file;
      const isProtected = file.reasons.includes("pinned") || file.reasons.includes("current file");
      if (!isProtected) {
        trimmed.push(file.path);
        continue;
      }
    }
    finalFiles.push(file);
    totalTokens += file.tokenEstimate;
  }

  return {
    files: finalFiles,
    totalTokens,
    contextLength: request.contextLength,
    usagePercent: Math.min(100, (totalTokens / request.contextLength) * 100),
    trimmed,
  };
}

/** Resolve a relative import URI to a workspace path. */
function resolveRelativeImport(uri: string, fromPath: WorkspacePath): string | null {
  if (!uri.startsWith("./") && !uri.startsWith("../")) return null;
  const fromDir = fromPath.split("/").slice(0, -1).join("/");
  const parts = (fromDir + "/" + uri).split("/");
  const out: string[] = [];
  for (const part of parts) {
    if (part === "." || part === "") continue;
    if (part === "..") { out.pop(); continue; }
    out.push(part);
  }
  return out.join("/");
}

/** Estimate the token cost of including a list of files. */
export function estimateContextCost(files: WorkspaceFile[]): number {
  return files.reduce((sum, f) => sum + f.tokenEstimate, 0);
}

/** Format a context result as a text block for the AI (markdown). */
export function formatContextForAI(result: ContextResult, files: WorkspaceFile[]): string {
  const parts: string[] = [];
  for (const ranked of result.files) {
    const file = files.find((f) => f.path === ranked.path);
    if (!file) continue;
    parts.push(`## ${file.path}\n\`\`\`${file.language}\n${getFileContent(file)}\n\`\`\``);
  }
  return parts.join("\n\n");
}

/** Get a file's content — WorkspaceFile doesn't store it, so we return a stub. */
function getFileContent(file: WorkspaceFile): string {
  // In Phase 3, the scanner holds content separately; the API route fetches it.
  // This formatter is used when content is available via a wrapper.
  return `// ${file.path} (${file.lines} lines, ${file.tokenEstimate} tokens)\n// Symbols: ${file.symbols.map((s) => s.name).join(", ") || "none"}`;
}

export { estimateTokens };
