"use client";

import * as React from "react";
import { Boxes, Zap, Server, Database, Route, Palette, Image as ImageIcon, Network } from "lucide-react";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SymbolKind } from "@/features/workspace-intelligence/types";

const categories: { id: SymbolKind; label: string; icon: React.ElementType; color: string }[] = [
  { id: "widget", label: "Widgets", icon: Boxes, color: "bg-violet-500/15 text-violet-600 dark:text-violet-400" },
  { id: "provider", label: "Providers", icon: Zap, color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
  { id: "service", label: "Services", icon: Server, color: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400" },
  { id: "repository", label: "Repositories", icon: Database, color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400" },
  { id: "model", label: "Models", icon: Database, color: "bg-pink-500/15 text-pink-600 dark:text-pink-400" },
  { id: "route", label: "Navigation", icon: Route, color: "bg-sky-500/15 text-sky-600 dark:text-sky-400" },
  { id: "theme", label: "Themes", icon: Palette, color: "bg-purple-500/15 text-purple-600 dark:text-purple-400" },
];

export function KnowledgeGraphTab() {
  const { files, knowledgeBase } = useWorkspaceIndexStore();
  const [selected, setSelected] = React.useState<SymbolKind | null>(null);

  // Group symbols by kind.
  const byKind = React.useMemo(() => {
    const map = new Map<SymbolKind, typeof files[0]["symbols"]>();
    for (const f of files) {
      for (const s of f.symbols) {
        if (!map.has(s.kind)) map.set(s.kind, []);
        map.get(s.kind)!.push(s);
      }
    }
    return map;
  }, [files]);

  if (!knowledgeBase) {
    return <div className="p-4 text-sm text-muted-foreground">Index not loaded.</div>;
  }

  return (
    <div className="flex h-full">
      {/* Category sidebar */}
      <div className="w-56 shrink-0 border-r border-border bg-muted/10 p-3 space-y-1.5">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Categories</div>
        {categories.map((c) => {
          const Icon = c.icon;
          const count = byKind.get(c.id)?.length ?? 0;
          return (
            <button
              key={c.id}
              onClick={() => setSelected(c.id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                selected === c.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="flex-1">{c.label}</span>
              <Badge variant="outline" className="text-[9px]">{count}</Badge>
            </button>
          );
        })}
        {/* Assets */}
        <button
          onClick={() => setSelected("asset" as SymbolKind)}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors",
            selected === ("asset" as SymbolKind) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span className="flex-1">Assets</span>
          <Badge variant="outline" className="text-[9px]">{knowledgeBase.assets.length}</Badge>
        </button>
      </div>

      {/* Main panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        {!selected ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Network className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Knowledge Graph</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              Select a category to explore relationships between widgets, providers, services, repositories, models, navigation, themes, and assets.
            </p>
          </div>
        ) : selected === ("asset" as SymbolKind) ? (
          <div className="ff-scroll h-full overflow-y-auto p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Assets ({knowledgeBase.assets.length})</h3>
            {knowledgeBase.assets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No assets declared in pubspec.yaml.</p>
            ) : (
              <div className="space-y-1">
                {knowledgeBase.assets.map((a) => (
                  <div key={a} className="flex items-center gap-2 rounded border border-border/60 bg-card p-2 text-xs">
                    <ImageIcon className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-mono text-foreground">{a}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <SymbolList kind={selected} symbols={byKind.get(selected) ?? []} />
        )}
      </div>
    </div>
  );
}

function SymbolList({ kind, symbols }: { kind: SymbolKind; symbols: Array<NonNullable<ReturnType<typeof useWorkspaceIndexStore.getState>["files"][0]["symbols"][0]>> }) {
  const category = categories.find((c) => c.id === kind);
  const Icon = category?.icon ?? Boxes;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", category?.color)}>
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{category?.label} ({symbols.length})</h3>
      </div>
      {symbols.length === 0 ? (
        <p className="text-xs text-muted-foreground">No {category?.label.toLowerCase()} found in the project.</p>
      ) : (
        <div className="space-y-1.5">
          {symbols.map((s, i) => (
            <div key={i} className="rounded-lg border border-border/60 bg-card p-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{s.name}</span>
                {s.widgetArchetype && (
                  <Badge variant="outline" className="text-[9px]">{s.widgetArchetype}</Badge>
                )}
                {s.modifiers.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">{s.modifiers.join(" ")}</span>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">L{s.line}</span>
              </div>
              {s.doc && <p className="mt-1 text-[11px] text-muted-foreground">{s.doc}</p>}
              <div className="mt-1 font-mono text-[10px] text-muted-foreground">{s.filePath}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
