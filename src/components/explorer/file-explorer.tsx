"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  FileCode2,
  FileText,
  FileCog,
  File,
  Folder,
  FolderOpen,
  Search,
  Plus,
  MoreHorizontal,
} from "lucide-react";
import { useEditorStore } from "@/stores";
import type { ProjectFileNode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Pick icon color based on file extension. */
function fileIconClass(name: string) {
  if (name.endsWith(".dart")) return "text-sky-500";
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return "text-amber-500";
  if (name.endsWith(".md")) return "text-violet-500";
  return "text-muted-foreground";
}

/** Stable component that renders the correct file-type icon via static refs. */
function FileIcon({ name, className }: { name: string; className?: string }) {
  if (name.endsWith(".dart")) return <FileCode2 className={className} />;
  if (name.endsWith(".yaml") || name.endsWith(".yml")) return <FileCog className={className} />;
  if (name.endsWith(".md")) return <FileText className={className} />;
  return <File className={className} />;
}

interface TreeNodeProps {
  node: ProjectFileNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const { expanded, toggleFolder, openFile, activeTabId, tabs } = useEditorStore();
  const isActive = tabs.some((t) => t.fileId === node.id && t.id === activeTabId);

  if (node.type === "folder") {
    const isOpen = expanded[node.id] ?? false;
    const Icon = isOpen ? FolderOpen : Folder;
    return (
      <div>
        <button
          onClick={() => toggleFolder(node.id)}
          className="group flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          {node.children && node.children.length > 0 ? (
            isOpen ? (
              <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 shrink-0" />
            )
          ) : (
            <span className="w-3.5" />
          )}
          <Icon className="h-3.5 w-3.5 shrink-0 text-primary/70" />
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => openFile(node.id)}
      className={cn(
        "group flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[13px] transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
      style={{ paddingLeft: depth * 12 + 22 }}
    >
      <FileIcon name={node.name} className={cn("h-3.5 w-3.5 shrink-0", fileIconClass(node.name))} />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export function FileExplorer() {
  const tree = useEditorStore((s) => s.tree);
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!query.trim()) return tree;
    const q = query.toLowerCase();
    const filterNodes = (nodes: ProjectFileNode[]): ProjectFileNode[] => {
      const out: ProjectFileNode[] = [];
      for (const n of nodes) {
        if (n.type === "folder") {
          const children = n.children ? filterNodes(n.children) : [];
          if (children.length > 0 || n.name.toLowerCase().includes(q)) {
            out.push({ ...n, children, expanded: true });
          }
        } else if (n.name.toLowerCase().includes(q) || n.path.toLowerCase().includes(q)) {
          out.push(n);
        }
      }
      return out;
    };
    return filterNodes(tree);
  }, [tree, query]);

  return (
    <div className="flex h-full flex-col bg-muted/20">
      {/* Header */}
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <div className="flex items-center gap-0.5">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="New file">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">New file</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="More">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter files…"
            className="h-7 bg-background pl-7 pr-2 text-xs"
          />
        </div>
      </div>

      {/* Tree */}
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto py-1">
        {filtered.length === 0 ? (
          <div className="px-3 py-6 text-center text-xs text-muted-foreground">
            No files match “{query}”.
          </div>
        ) : (
          filtered.map((node) => <TreeNode key={node.id} node={node} depth={0} />)
        )}
      </div>
    </div>
  );
}
