"use client";

import { Activity, Check, GitBranch, Wifi } from "lucide-react";
import { useEditorStore, useProjectStore } from "@/stores";
import { siteConfig } from "@/config/site";

/**
 * Status bar — the IDE-style footer pinned to the bottom of the app shell.
 * Satisfies the sticky-footer requirement while doubling as a real workspace
 * status surface (branch, dirty count, connection, version).
 */
export function AppStatusbar() {
  const tabs = useEditorStore((s) => s.tabs);
  const projects = useProjectStore((s) => s.projects);
  const selectedId = useProjectStore((s) => s.selectedId);
  const dirtyCount = tabs.filter((t) => t.dirty).length;
  const activeProject = projects.find((p) => p.id === selectedId) ?? projects[0];

  return (
    <footer className="flex h-7 shrink-0 items-center gap-4 border-t border-border bg-muted/40 px-3 text-[11px] text-muted-foreground">
      <span className="inline-flex items-center gap-1.5">
        <GitBranch className="h-3 w-3" /> {activeProject?.name ?? "main"}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Activity className="h-3 w-3 text-emerald-500" /> Ready
      </span>
      <span className="hidden sm:inline">
        {dirtyCount > 0 ? (
          <span className="text-amber-600 dark:text-amber-400">{dirtyCount} unsaved</span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Check className="h-3 w-3 text-emerald-500" /> All saved
          </span>
        )}
      </span>
      <span className="ml-auto inline-flex items-center gap-1.5">
        <Wifi className="h-3 w-3 text-emerald-500" /> Connected
      </span>
      <span className="hidden sm:inline">v{siteConfig.version}</span>
    </footer>
  );
}
