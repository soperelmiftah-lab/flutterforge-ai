"use client";

import * as React from "react";
import {
  Brain,
  FileCode2,
  MapPin,
  FolderOpen,
  Pin,
  Clock,
  Search,
  Terminal,
  History,
  Eraser,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "./shared";
import { cn } from "@/lib/utils";
import type { WorkspaceMemory, WorkspacePath } from "@/features/workspace-intelligence/types";

/** In-memory workspace memory (persisted to localStorage by the memory module). */
const MEMORY_KEY = "flutterforge-ws-memory";

function loadMemory(): WorkspaceMemory {
  const fallback: WorkspaceMemory = {
    currentProjectId: null,
    currentFilePath: null,
    cursor: null,
    openTabs: [],
    recentFiles: [],
    pinnedFiles: [],
    recentSearches: [],
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(MEMORY_KEY);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function saveMemory(m: WorkspaceMemory) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export function MemoryTab() {
  const [memory, setMemory] = React.useState<WorkspaceMemory>(loadMemory);

  React.useEffect(() => {
    const handler = () => setMemory(loadMemory());
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const clearMemory = () => {
    const cleared: WorkspaceMemory = {
      currentProjectId: memory.currentProjectId,
      currentFilePath: null,
      cursor: null,
      openTabs: [],
      recentFiles: [],
      pinnedFiles: memory.pinnedFiles,
      recentSearches: [],
    };
    saveMemory(cleared);
    setMemory(cleared);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Workspace Memory</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={clearMemory}>
          <Eraser className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Current state */}
        <Section title="Current State" icon={MapPin}>
          <div className="space-y-1.5 text-xs">
            <MemoryRow label="Current project" value={memory.currentProjectId ?? "—"} />
            <MemoryRow label="Current file" value={memory.currentFilePath ?? "—"} mono />
            <MemoryRow
              label="Cursor"
              value={memory.cursor ? `L${memory.cursor.line}:${memory.cursor.column}` : "—"}
              mono
            />
          </div>
        </Section>

        {/* Open tabs */}
        <Section title="Open Tabs" icon={FolderOpen} action={<Badge variant="outline">{memory.openTabs.length}</Badge>}>
          {memory.openTabs.length === 0 ? (
            <p className="text-xs text-muted-foreground">No open tabs.</p>
          ) : (
            <PathList paths={memory.openTabs} icon={FileCode2} />
          )}
        </Section>

        {/* Pinned files */}
        <Section title="Pinned Files" icon={Pin} action={<Badge variant="outline">{memory.pinnedFiles.length}</Badge>}>
          {memory.pinnedFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pinned files. Pinned files are always included in AI context.</p>
          ) : (
            <PathList paths={memory.pinnedFiles} icon={Pin} color="text-amber-500" />
          )}
        </Section>

        {/* Recent files */}
        <Section title="Recent Files" icon={Clock} action={<Badge variant="outline">{memory.recentFiles.length}</Badge>}>
          {memory.recentFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent files.</p>
          ) : (
            <PathList paths={memory.recentFiles} icon={Clock} />
          )}
        </Section>

        {/* Recent searches */}
        <Section title="Recent Searches" icon={Search} action={<Badge variant="outline">{memory.recentSearches.length}</Badge>}>
          {memory.recentSearches.length === 0 ? (
            <p className="text-xs text-muted-foreground">No recent searches.</p>
          ) : (
            <div className="flex flex-wrap gap-1">
              {memory.recentSearches.map((s, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </div>
          )}
        </Section>

        {/* Workspace history (placeholder) */}
        <Section title="Workspace History" icon={History} action={<Badge variant="outline" className="text-[9px]">Phase 4</Badge>}>
          <p className="text-xs text-muted-foreground">
            Full workspace history (edits, builds, agent runs) arrives with the Agent Manager in Phase 4.
          </p>
        </Section>
      </div>
    </div>
  );
}

function MemoryRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate text-foreground", mono && "font-mono text-[11px]")}>{value}</span>
    </div>
  );
}

function PathList({
  paths,
  icon: Icon,
  color,
}: {
  paths: WorkspacePath[];
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <div className="space-y-0.5">
      {paths.slice(0, 12).map((p, i) => (
        <div key={`${p}-${i}`} className="flex items-center gap-2 rounded px-1.5 py-0.5 text-xs hover:bg-muted/40">
          <Icon className={cn("h-3 w-3 shrink-0", color ?? "text-muted-foreground")} />
          <span className="truncate font-mono text-foreground">{p}</span>
        </div>
      ))}
      {paths.length > 12 && (
        <p className="text-[10px] text-muted-foreground">+{paths.length - 12} more</p>
      )}
    </div>
  );
}
