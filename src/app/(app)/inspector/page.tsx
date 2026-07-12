"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Boxes,
  Search,
  Network,
  Share2,
  FileCode2,
  BarChart3,
  Brain,
  ScrollText,
  RefreshCw,
} from "lucide-react";
import { useWorkspaceHydration } from "@/hooks/use-workspace-hydration";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { useDependencyStore } from "@/stores/dependency-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OverviewTab } from "@/components/inspector/overview-tab";
import { InspectorTab } from "@/components/inspector/inspector-tab";
import { SearchTab } from "@/components/inspector/search-tab";
import { DependenciesTab } from "@/components/inspector/dependencies-tab";
import { KnowledgeGraphTab } from "@/components/inspector/knowledge-graph-tab";
import { ContextTab } from "@/components/inspector/context-tab";
import { StatisticsTab } from "@/components/inspector/statistics-tab";
import { MemoryTab } from "@/components/inspector/memory-tab";
import { LogsTab } from "@/components/inspector/logs-tab";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "inspector", label: "Inspector", icon: Boxes },
  { id: "search", label: "Search", icon: Search },
  { id: "dependencies", label: "Dependencies", icon: Network },
  { id: "knowledge", label: "Knowledge Graph", icon: Share2 },
  { id: "context", label: "Context", icon: FileCode2 },
  { id: "statistics", label: "Statistics", icon: BarChart3 },
  { id: "memory", label: "Memory", icon: Brain },
  { id: "logs", label: "Logs", icon: ScrollText },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function InspectorPage() {
  useWorkspaceHydration();
  const [active, setActive] = React.useState<TabId>("overview");
  const buildIndex = useWorkspaceIndexStore((s) => s.buildIndex);
  const buildGraph = useDependencyStore((s) => s.buildGraph);
  const loading = useWorkspaceIndexStore((s) => s.loading);
  const lastIndexedAt = useWorkspaceIndexStore((s) => s.lastIndexedAt);
  const fileCount = useWorkspaceIndexStore((s) => s.files.length);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tab bar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                active === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
        <div className="ml-auto flex shrink-0 items-center gap-2 pl-2">
          {fileCount > 0 && (
            <Badge variant="outline" className="text-[9px]">
              {fileCount} files indexed
            </Badge>
          )}
          {lastIndexedAt && (
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              {new Date(lastIndexedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => { buildIndex(); buildGraph(); }}
            disabled={loading}
          >
            <RefreshCw className={cn("mr-1 h-3 w-3", loading && "animate-spin")} />
            Re-index
          </Button>
        </div>
      </div>

      {/* Active tab content */}
      <div className="min-h-0 flex-1">
        {active === "overview" && <OverviewTab />}
        {active === "inspector" && <InspectorTab />}
        {active === "search" && <SearchTab />}
        {active === "dependencies" && <DependenciesTab />}
        {active === "knowledge" && <KnowledgeGraphTab />}
        {active === "context" && <ContextTab />}
        {active === "statistics" && <StatisticsTab />}
        {active === "memory" && <MemoryTab />}
        {active === "logs" && <LogsTab />}
      </div>
    </div>
  );
}
