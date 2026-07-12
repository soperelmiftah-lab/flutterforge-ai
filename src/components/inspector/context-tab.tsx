"use client";

import * as React from "react";
import { FileCode2, Pin, Search, Loader2, Coins, TrendingDown } from "lucide-react";
import { useContextStore } from "@/stores/context-store";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Metric, Section } from "./shared";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/features/ai/tokens/counter";

export function ContextTab() {
  const { result, loading, error, topN, setTopN, assembleContext, pinnedFiles, togglePin } = useContextStore();
  const { files } = useWorkspaceIndexStore();
  const [query, setQuery] = React.useState("");

  const handleAssemble = () => assembleContext(query, 8192);

  return (
    <div className="flex h-full flex-col">
      {/* Input */}
      <div className="border-b border-border p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAssemble()}
            placeholder="Describe what you're working on — the engine finds only relevant files…"
            className="h-9"
          />
          <Button size="sm" className="h-9" onClick={handleAssemble} disabled={loading || !query.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            Analyze
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">Top N:</span>
          {([5, 10, 20] as const).map((n) => (
            <button
              key={n}
              onClick={() => setTopN(n)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                topN === n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              {n}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">
            Pinned: {pinnedFiles.length} · Never sends the whole project
          </span>
        </div>
      </div>

      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {error && <div className="text-sm text-destructive">{error}</div>}

        {!result && !loading && !error && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Search className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Context Engine</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Enter a query to see which files the Context Engine selects for the AI. It ranks by relevance, fits the token budget, and always keeps pinned files + the current file.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-3">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Files" value={result.files.length} />
              <Metric label="Tokens" value={formatTokens(result.totalTokens)} />
              <Metric label="Usage" value={`${result.usagePercent.toFixed(1)}%`} />
            </div>

            {/* Token budget bar */}
            <div className="rounded-lg border border-border/60 bg-card p-3">
              <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> Token budget</span>
                <span>{formatTokens(result.totalTokens)} / {formatTokens(result.contextLength)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    result.usagePercent > 80 ? "bg-rose-500" : result.usagePercent > 50 ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${result.usagePercent}%` }}
                />
              </div>
            </div>

            {/* Ranked files */}
            <Section title="Ranked files (sent to AI)" icon={FileCode2} action={<Badge variant="outline">{result.files.length}</Badge>}>
              <div className="space-y-1.5">
                {result.files.map((f, i) => (
                  <div key={f.path} className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/20 p-2.5">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-xs text-foreground">{f.path}</div>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {f.reasons.map((r) => (
                          <Badge key={r} variant="outline" className="text-[9px]">{r}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[10px] font-mono text-foreground">{(f.score * 100).toFixed(0)}%</div>
                      <div className="text-[10px] text-muted-foreground">{formatTokens(f.tokenEstimate)}t</div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Trimmed files */}
            {result.trimmed.length > 0 && (
              <Section title="Trimmed (token budget)" icon={TrendingDown} action={<Badge variant="outline">{result.trimmed.length}</Badge>}>
                <div className="space-y-0.5">
                  {result.trimmed.map((p) => (
                    <div key={p} className="truncate font-mono text-[11px] text-muted-foreground line-through">{p}</div>
                  ))}
                </div>
              </Section>
            )}

            {/* Pinned files manager */}
            <Section title="Pinned files" icon={Pin} action={<Badge variant="outline">{pinnedFiles.length}</Badge>}>
              {pinnedFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pinned files. Pinned files are always included in context.</p>
              ) : (
                <div className="space-y-1">
                  {pinnedFiles.map((p) => {
                    const file = files.find((f) => f.path === p);
                    return (
                      <div key={p} className="flex items-center gap-2 rounded border border-border/60 p-2 text-xs">
                        <Pin className="h-3 w-3 text-amber-500" />
                        <span className="truncate font-mono text-foreground">{p}</span>
                        {file && <span className="ml-auto text-[10px] text-muted-foreground">{formatTokens(file.tokenEstimate)}t</span>}
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => togglePin(p)} aria-label="Unpin">
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}
