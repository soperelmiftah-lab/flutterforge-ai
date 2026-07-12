"use client";

import {
  Activity,
  Check,
  GitBranch,
  Wifi,
  Zap,
  Sparkles,
  FileCode2,
  MapPin,
  Coins,
  Boxes,
  Cpu,
  type LucideIcon,
} from "lucide-react";
import { useEditorStore, useProjectStore, useWorkspaceStore } from "@/stores";
import { useAIStore } from "@/stores/ai-store";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { useTokenStore } from "@/stores/token-store";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/**
 * Enhanced status bar — the IDE-style footer pinned to the bottom of the app
 * shell. Shows: current provider, model, project, file, line/col, encoding,
 * SDKs, index status, token usage, AI status, and connection.
 *
 * Satisfies the sticky-footer requirement while doubling as a real workspace
 * status surface (like VS Code / Cursor).
 */
export function AppStatusbar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const projects = useProjectStore((s) => s.projects);
  const selectedId = useProjectStore((s) => s.selectedId);
  const dirtyCount = tabs.filter((t) => t.dirty).length;
  const activeProject = projects.find((p) => p.id === selectedId) ?? projects[0];
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const ai = useAIStore();
  const indexedAt = useWorkspaceIndexStore((s) => s.lastIndexedAt);
  const fileCount = useWorkspaceIndexStore((s) => s.files.length);
  const sessionTokens = useTokenStore((s) => s.session.totalTokens);

  return (
    <footer className="flex h-7 shrink-0 items-center gap-3 border-t border-border bg-muted/40 px-3 text-[10px] text-muted-foreground overflow-x-auto ff-scroll">
      {/* Left: project + git */}
      <StatusItem icon={GitBranch} label={activeProject?.name ?? "no project"} />

      {/* File */}
      {activeTab && (
        <>
          <StatusItem icon={FileCode2} label={activeTab.name} />
          <span className="hidden sm:inline">UTF-8</span>
        </>
      )}

      {/* Dirty indicator */}
      <StatusItem
        icon={dirtyCount > 0 ? Activity : Check}
        label={dirtyCount > 0 ? `${dirtyCount} unsaved` : "saved"}
        className={dirtyCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"}
      />

      {/* Separator */}
      <span className="hidden sm:inline text-border">|</span>

      {/* Center: AI status */}
      <StatusItem icon={Zap} label={<span className="capitalize">{ai.provider}</span>} />
      {ai.model && (
        <StatusItem icon={Sparkles} label={ai.model.length > 20 ? ai.model.slice(0, 18) + "…" : ai.model} className="hidden md:inline" />
      )}
      {sessionTokens > 0 && (
        <StatusItem icon={Coins} label={`${sessionTokens} tok`} className="hidden md:inline" />
      )}

      {/* Separator */}
      <span className="hidden md:inline text-border">|</span>

      {/* Index status */}
      <StatusItem
        icon={Boxes}
        label={indexedAt ? `${fileCount} files` : "not indexed"}
        className={cn("hidden lg:inline", indexedAt ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}
      />

      {/* SDK (from project framework) */}
      <StatusItem icon={Cpu} label={activeProject?.framework ?? "Flutter"} className="hidden lg:inline" />

      <div className="ml-auto flex items-center gap-3">
        {/* Line:col (placeholder — wired to editor cursor in a future refinement) */}
        {activeTab && (
          <StatusItem icon={MapPin} label="L1:C1" className="hidden sm:inline" />
        )}

        {/* Connection */}
        <StatusItem icon={Wifi} label="Connected" className="text-emerald-600 dark:text-emerald-400" />

        {/* Version */}
        <span className="hidden sm:inline">v{siteConfig.version}</span>
      </div>
    </footer>
  );
}

function StatusItem({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1", className)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}
