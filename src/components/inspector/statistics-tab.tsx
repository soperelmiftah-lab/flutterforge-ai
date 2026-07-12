"use client";

import * as React from "react";
import { BarChart3, Hash, TrendingUp, FileCode2, Layers } from "lucide-react";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { BarRow, Metric, Section, TabLoading } from "./shared";
import { formatTokens } from "@/features/ai/tokens/counter";
import { Badge } from "@/components/ui/badge";

export function StatisticsTab() {
  const { statistics, loading } = useWorkspaceIndexStore();

  if (loading && !statistics) return <TabLoading label="Computing statistics…" />;
  if (!statistics) return <div className="p-4 text-sm text-muted-foreground">No statistics available.</div>;

  const stats = statistics;
  const symbolEntries = Object.entries(stats.symbolsByKind).sort((a, b) => b[1] - a[1]);
  const maxSymbol = Math.max(...symbolEntries.map(([, n]) => n), 1);
  const fileTypeEntries = Object.entries(stats.filesByType).sort((a, b) => b[1] - a[1]);
  const maxFileType = Math.max(...fileTypeEntries.map(([, n]) => n), 1);
  const linesEntries = Object.entries(stats.linesByLanguage).sort((a, b) => b[1] - a[1]);

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Metric label="Total Files" value={stats.totalFiles} icon={FileCode2} />
        <Metric label="Total Symbols" value={stats.totalSymbols} icon={Layers} />
        <Metric label="Total Lines" value={stats.totalLines.toLocaleString()} icon={Hash} />
        <Metric label="Total Tokens" value={formatTokens(stats.totalTokens)} icon={TrendingUp} />
        <Metric label="Avg Size" value={`${stats.averageSize}L`} icon={BarChart3} />
        <Metric label="Languages" value={Object.keys(stats.linesByLanguage).length} icon={Hash} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Symbols by kind */}
        <Section title="Symbols by Kind" icon={Layers}>
          <div className="space-y-1.5">
            {symbolEntries.map(([kind, count]) => (
              <BarRow
                key={kind}
                label={kind}
                count={count}
                max={maxSymbol}
                color={symbolColor(kind)}
              />
            ))}
          </div>
        </Section>

        {/* Files by type */}
        <Section title="Files by Type" icon={FileCode2}>
          <div className="space-y-1.5">
            {fileTypeEntries.map(([ext, count]) => (
              <BarRow key={ext} label={`.${ext || "none"}`} count={count} max={maxFileType} color="bg-amber-500" />
            ))}
          </div>
        </Section>

        {/* Lines by language */}
        <Section title="Lines by Language" icon={Hash}>
          <div className="space-y-1.5">
            {linesEntries.map(([lang, lines]) => (
              <BarRow key={lang} label={lang} count={lines} max={Math.max(...linesEntries.map(([, l]) => l), 1)} color="bg-cyan-500" />
            ))}
          </div>
        </Section>

        {/* Largest files */}
        <Section title="Largest Files" icon={TrendingUp}>
          <div className="space-y-1">
            {stats.largestFiles.slice(0, 8).map((f) => (
              <div key={f.path} className="flex items-center justify-between text-xs">
                <span className="truncate font-mono text-foreground">{f.path}</span>
                <span className="ml-2 shrink-0 text-muted-foreground">{f.lines}L · {formatTokens(f.tokenEstimate)}t</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Most imported */}
        <Section title="Most Referenced Files" icon={TrendingUp}>
          {stats.mostImportedFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No cross-file imports detected.</p>
          ) : (
            <div className="space-y-1">
              {stats.mostImportedFiles.slice(0, 8).map((f) => (
                <div key={f.path} className="flex items-center justify-between text-xs">
                  <span className="truncate font-mono text-foreground">{f.path}</span>
                  <Badge variant="outline" className="text-[9px]">{f.importCount} refs</Badge>
                </div>
              ))}
            </div>
          )}
        </Section>

        {/* State management & routing */}
        <Section title="Architecture" icon={Layers}>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">State Management</span>
              <span className="font-medium capitalize text-foreground">{useWorkspaceIndexStore.getState().knowledgeBase?.stateManagement ?? "none"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Routing</span>
              <span className="font-medium capitalize text-foreground">{useWorkspaceIndexStore.getState().knowledgeBase?.routing ?? "none"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Project kind</span>
              <span className="font-medium capitalize text-foreground">{useWorkspaceIndexStore.getState().knowledgeBase?.kind ?? "unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Complexity</span>
              <span className="font-medium text-foreground">{complexityLabel(stats.totalLines, stats.totalSymbols)}</span>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}

function symbolColor(kind: string): string {
  const map: Record<string, string> = {
    widget: "bg-violet-500",
    class: "bg-cyan-500",
    function: "bg-amber-500",
    method: "bg-orange-500",
    provider: "bg-emerald-500",
    route: "bg-sky-500",
    service: "bg-fuchsia-500",
    repository: "bg-indigo-500",
    model: "bg-pink-500",
    enum: "bg-rose-500",
    mixin: "bg-teal-500",
    extension: "bg-purple-500",
    theme: "bg-purple-500",
    constant: "bg-zinc-500",
    typedef: "bg-zinc-500",
    variable: "bg-zinc-500",
  };
  return map[kind] ?? "bg-zinc-500";
}

function complexityLabel(lines: number, symbols: number): string {
  const score = lines + symbols * 10;
  if (score < 500) return "Simple";
  if (score < 2000) return "Moderate";
  if (score < 8000) return "Complex";
  return "Enterprise";
}
