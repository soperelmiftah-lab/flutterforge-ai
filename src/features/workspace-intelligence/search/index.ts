/**
 * @module features/workspace-intelligence/search
 *
 * Semantic Search — searches the project index by keyword, symbol, class,
 * method, provider, route, asset, comment, and README content. Returns
 * ranked results with relevance scores.
 *
 * The ranking blends: name match (highest), symbol-kind match, fuzzy
 * substring match, and file importance (from the dependency graph).
 */

import type {
  WorkspaceFile,
  SearchQuery,
  SearchResult,
  SymbolRef,
  SymbolKind,
} from "@/features/workspace-intelligence/types";
import type { DependencyGraph } from "../graph";

/** Normalise a string for matching (lowercase, trim). */
function norm(s: string): string {
  return s.toLowerCase().trim();
}

/** Compute a fuzzy relevance score (0-1) for a query against a target. */
function scoreMatch(query: string, target: string): number {
  const q = norm(query);
  const t = norm(target);
  if (!q || !t) return 0;
  if (t === q) return 1;
  if (t.startsWith(q)) return 0.9;
  if (t.includes(q)) return 0.75;
  // Camel-case / snake-case token matching.
  const tokens = t.split(/[\s_/.-]+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok.startsWith(q)) return 0.6;
    if (tok.includes(q)) return 0.5;
  }
  // Fuzzy: all query chars appear in order.
  if (isSubsequence(q, t)) return 0.3;
  return 0;
}

function isSubsequence(needle: string, haystack: string): boolean {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i++;
    if (i >= needle.length) return true;
  }
  return false;
}

/** Score boost for each symbol kind when the query mentions it. */
const KIND_KEYWORDS: Record<string, SymbolKind[]> = {
  widget: ["widget"],
  class: ["class"],
  function: ["function", "fn", "func"],
  method: ["method"],
  provider: ["provider"],
  route: ["route", "page", "screen"],
  service: ["service"],
  repository: ["repository", "repo"],
  model: ["model", "dto", "entity"],
  enum: ["enum"],
  mixin: ["mixin"],
  extension: ["extension"],
  theme: ["theme"],
};

/**
 * Search the project index.
 */
export function search(
  files: WorkspaceFile[],
  graph: DependencyGraph | null,
  query: SearchQuery
): SearchResult[] {
  const results: SearchResult[] = [];
  const limit = query.limit ?? 20;

  // Detect intent: did the user ask for a specific symbol kind?
  let kindFilter = query.kinds ?? [];
  const qLower = query.query.toLowerCase();
  for (const [kw, kinds] of Object.entries(KIND_KEYWORDS)) {
    if (qLower.includes(kw)) {
      kindFilter = [...kindFilter, ...kinds];
    }
  }

  const baseQuery = query.query.trim();
  if (!baseQuery) return [];

  for (const file of files) {
    const importance = graph?.nodes.get(file.path)?.importance ?? 0.3;

    // 1. File name match.
    const nameScore = scoreMatch(baseQuery, file.name);
    if (nameScore > 0) {
      results.push({
        path: file.path,
        name: file.name,
        kind: "file",
        score: Math.min(1, nameScore * 0.8 + importance * 0.2),
        matchedFields: ["name"],
      });
    }

    // 2. Path match.
    const pathScore = scoreMatch(baseQuery, file.path);
    if (pathScore > 0 && pathScore > nameScore) {
      results.push({
        path: file.path,
        name: file.name,
        kind: "file",
        score: Math.min(1, pathScore * 0.6 + importance * 0.2),
        matchedFields: ["path"],
      });
    }

    // 3. Symbol matches.
    for (const sym of file.symbols) {
      if (kindFilter.length > 0 && !kindFilter.includes(sym.kind)) continue;
      if (query.extensions && !query.extensions.includes(file.extension)) continue;

      const symNameScore = scoreMatch(baseQuery, sym.name);
      if (symNameScore > 0) {
        results.push({
          path: file.path,
          name: file.name,
          kind: "symbol",
          symbol: sym,
          score: Math.min(1, symNameScore * 0.85 + importance * 0.15),
          matchedFields: [`symbol:${sym.kind}`],
          line: sym.line,
        });
      }

      // 4. Doc/comment match.
      if (query.includeComments !== false && sym.doc) {
        const docScore = scoreMatch(baseQuery, sym.doc);
        if (docScore > 0.3) {
          results.push({
            path: file.path,
            name: file.name,
            kind: "comment",
            symbol: sym,
            score: Math.min(1, docScore * 0.5 + importance * 0.1),
            matchedFields: ["doc"],
            line: sym.line,
          });
        }
      }
    }

    // 5. Import URI match (for "find who imports X").
    for (const imp of file.imports) {
      const impScore = scoreMatch(baseQuery, imp.uri);
      if (impScore > 0.6) {
        results.push({
          path: file.path,
          name: file.name,
          kind: "import",
          score: Math.min(1, impScore * 0.5 + importance * 0.1),
          matchedFields: ["import"],
        });
      }
    }
  }

  // Deduplicate by (path, kind, symbol name), keeping the highest score.
  const deduped = new Map<string, SearchResult>();
  for (const r of results) {
    const key = `${r.path}:${r.kind}:${r.symbol?.name ?? ""}`;
    const existing = deduped.get(key);
    if (!existing || r.score > existing.score) {
      deduped.set(key, r);
    }
  }

  // Sort by score descending and return top N.
  return Array.from(deduped.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Quick "find symbols by name" — used by the symbol picker UI. */
export function findSymbols(
  files: WorkspaceFile[],
  name: string,
  limit = 20
): SymbolRef[] {
  const q = norm(name);
  if (!q) return [];
  const out: Array<{ sym: SymbolRef; score: number }> = [];
  for (const file of files) {
    for (const sym of file.symbols) {
      const score = scoreMatch(name, sym.name);
      if (score > 0) out.push({ sym, score });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, limit).map((x) => x.sym);
}
