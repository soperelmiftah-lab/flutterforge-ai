"use client";

import * as React from "react";
import { Search, X, Hash, FileCode2, Boxes, ArrowRight, Loader2 } from "lucide-react";
import { useSearchStore } from "@/stores/search-store";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SearchResult, SymbolKind } from "@/features/workspace-intelligence/types";

const kindFilters: { id: SymbolKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "widget", label: "Widgets" },
  { id: "class", label: "Classes" },
  { id: "function", label: "Functions" },
  { id: "method", label: "Methods" },
  { id: "provider", label: "Providers" },
  { id: "route", label: "Routes" },
  { id: "service", label: "Services" },
];

const kindColors: Record<string, string> = {
  file: "bg-primary/10 text-primary",
  symbol: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  import: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  route: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  asset: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  comment: "bg-muted text-muted-foreground",
};

export function SearchTab() {
  const { query, results, loading, search, clear, recentSearches } = useSearchStore();
  const [localQuery, setLocalQuery] = React.useState(query);
  const [activeKind, setActiveKind] = React.useState<SymbolKind | "all">("all");
  const [selectedIdx, setSelectedIdx] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Filter results by kind.
  const filtered = activeKind === "all"
    ? results
    : results.filter((r) => r.symbol?.kind === activeKind);

  // Keyboard navigation.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIdx]) {
        // In a full IDE this would open the file; here we just select it.
        void filtered[selectedIdx];
      } else {
        // No results yet — trigger the search.
        handleSearch();
      }
    } else if (e.key === "Escape") {
      clear();
      setLocalQuery("");
      inputRef.current?.blur();
    }
  };

  // Scroll selected into view.
  React.useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleSearch = (q?: string) => {
    const text = q ?? localQuery;
    setLocalQuery(text);
    search(text);
    setSelectedIdx(0);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Search input */}
      <div className="border-b border-border p-3 space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search files, symbols, classes, widgets, providers…"
            className="pl-9 pr-9"
            autoFocus
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
          )}
          {!loading && localQuery && (
            <button
              onClick={() => { clear(); setLocalQuery(""); inputRef.current?.focus(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Kind filters */}
        <div className="flex flex-wrap gap-1">
          {kindFilters.map((f) => (
            <button
              key={f.id}
              onClick={() => { setActiveKind(f.id); setSelectedIdx(0); }}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                activeKind === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Recent searches */}
        {!localQuery && recentSearches.length > 0 && (
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Recent:</span>
            {recentSearches.slice(0, 6).map((s) => (
              <button
                key={s}
                onClick={() => handleSearch(s)}
                className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      <div ref={listRef} className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {!localQuery && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Search className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-foreground">Search the project</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Find files, symbols, classes, widgets, providers, and more. Use ↑↓ to navigate, Enter to open, Esc to clear.
            </p>
          </div>
        )}

        {localQuery && !loading && filtered.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-muted-foreground">No results for "{localQuery}"</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or filter.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="space-y-1.5">
            <p className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              <span className="ml-auto text-[10px]">↑↓ navigate · Enter open · Esc clear</span>
            </p>
            {filtered.map((r, i) => (
              <SearchResultCard
                key={`${r.path}-${i}`}
                result={r}
                query={localQuery}
                selected={i === selectedIdx}
                onClick={() => setSelectedIdx(i)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchResultCard({
  result,
  query,
  selected,
  onClick,
}: {
  result: SearchResult;
  query: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      data-idx={selected ? "sel" : undefined}
      onClick={onClick}
      className={cn(
        "flex cursor-pointer items-start gap-2 rounded-md border p-2.5 transition-all",
        selected ? "border-primary bg-primary/5" : "border-border/60 bg-card hover:border-primary/40"
      )}
    >
      <div className={cn("mt-0.5 flex h-5 w-16 shrink-0 items-center justify-center rounded text-[9px] font-medium uppercase", kindColors[result.kind] ?? kindColors.comment)}>
        {result.kind}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {result.symbol && (
            <Badge variant="outline" className="text-[9px]">{result.symbol.kind}</Badge>
          )}
          <span className="truncate text-sm font-medium text-foreground">
            <Highlight text={result.symbol?.name ?? result.name} query={query} />
          </span>
          {result.line && (
            <span className="text-[10px] text-muted-foreground">:{result.line}</span>
          )}
        </div>
        <div className="truncate font-mono text-[11px] text-muted-foreground">
          <Highlight text={result.path} query={query} />
        </div>
        {result.matchedFields.length > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center gap-1">
            {result.matchedFields.map((f) => (
              <Badge key={f} variant="outline" className="text-[9px]">{f}</Badge>
            ))}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[10px] font-mono text-foreground">{(result.score * 100).toFixed(0)}%</div>
        {selected && <ArrowRight className="ml-auto h-3 w-3 text-primary" />}
      </div>
    </div>
  );
}

/** Highlight the query substring within text. */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const q = query.toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-primary/30 px-0.5 text-foreground">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}
