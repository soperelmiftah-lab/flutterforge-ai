"use client";

import * as React from "react";
import {
  FileCode2,
  FileCog,
  FileText,
  File as FileIcon,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  Network,
  Pin,
  PinOff,
  Copy,
  Check,
} from "lucide-react";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { useDependencyStore } from "@/stores/dependency-store";
import { useContextStore } from "@/stores/context-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkspaceFile, SymbolRef, SymbolKind } from "@/features/workspace-intelligence/types";
import { toast } from "sonner";

const symbolKindMeta: Record<SymbolKind, { color: string; label: string }> = {
  class: { color: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400", label: "class" },
  widget: { color: "bg-violet-500/15 text-violet-600 dark:text-violet-400", label: "widget" },
  function: { color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "fn" },
  method: { color: "bg-amber-500/15 text-amber-600 dark:text-amber-400", label: "method" },
  enum: { color: "bg-rose-500/15 text-rose-600 dark:text-rose-400", label: "enum" },
  mixin: { color: "bg-teal-500/15 text-teal-600 dark:text-teal-400", label: "mixin" },
  extension: { color: "bg-orange-500/15 text-orange-600 dark:text-orange-400", label: "ext" },
  typedef: { color: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400", label: "typedef" },
  provider: { color: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400", label: "provider" },
  route: { color: "bg-sky-500/15 text-sky-600 dark:text-sky-400", label: "route" },
  service: { color: "bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-400", label: "service" },
  repository: { color: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400", label: "repo" },
  model: { color: "bg-pink-500/15 text-pink-600 dark:text-pink-400", label: "model" },
  theme: { color: "bg-purple-500/15 text-purple-600 dark:text-purple-400", label: "theme" },
  constant: { color: "bg-muted text-muted-foreground", label: "const" },
  variable: { color: "bg-muted text-muted-foreground", label: "var" },
};

function FileIconFor({ ext, className }: { ext: string; className?: string }) {
  if (ext === "dart") return <FileCode2 className={className} />;
  if (ext === "yaml" || ext === "yml") return <FileCog className={className} />;
  if (ext === "md") return <FileText className={className} />;
  return <FileIcon className={className} />;
}

export function InspectorTab() {
  const { files, loading } = useWorkspaceIndexStore();
  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({ lib: true });

  // Group files into a tree.
  const tree = React.useMemo(() => buildTree(files), [files]);

  const selected = files.find((f) => f.path === selectedPath);

  if (loading && files.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Indexing…</div>;
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div className="flex w-1/2 min-w-[240px] flex-col border-r border-border bg-muted/10">
        <div className="flex h-9 shrink-0 items-center border-b border-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Project Explorer
          <span className="ml-auto text-[10px] font-normal">{files.length} files</span>
        </div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto py-1">
          {tree.map((node) => (
            <TreeNode
              key={node.path}
              node={node}
              depth={0}
              expanded={expanded}
              setExpanded={setExpanded}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <FileDetail file={selected} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <FileCode2 className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">Select a file to inspect</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              View symbols, imports, exports, and dependencies for any file in the project.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface TreeNodeData {
  path: string;
  name: string;
  type: "file" | "folder";
  file?: WorkspaceFile;
  children?: TreeNodeData[];
}

function buildTree(files: WorkspaceFile[]): TreeNodeData[] {
  const root: TreeNodeData = { path: "", name: "", type: "folder", children: [] };
  for (const file of files) {
    const parts = file.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      let child = current.children?.find((c) => c.name === part && c.type === (isLast ? "file" : "folder"));
      if (!child) {
        child = {
          path,
          name: part,
          type: isLast ? "file" : "folder",
          file: isLast ? file : undefined,
          children: isLast ? undefined : [],
        };
        current.children?.push(child);
      }
      current = child;
    }
  }
  // Sort: folders first, then files, alphabetically.
  const sort = (node: TreeNodeData) => {
    if (!node.children) return;
    node.children.sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    node.children.forEach(sort);
  };
  sort(root);
  return root.children ?? [];
}

function TreeNode({
  node,
  depth,
  expanded,
  setExpanded,
  selectedPath,
  onSelect,
}: {
  node: TreeNodeData;
  depth: number;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}) {
  if (node.type === "folder") {
    const isOpen = expanded[node.path] ?? false;
    return (
      <div>
        <button
          onClick={() => setExpanded((e) => ({ ...e, [node.path]: !e[node.path] }))}
          className="flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          style={{ paddingLeft: depth * 12 + 6 }}
        >
          {node.children && node.children.length > 0 ? (
            isOpen ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />
          ) : (
            <span className="w-3" />
          )}
          {isOpen ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-primary/70" />}
          <span className="truncate">{node.name}</span>
        </button>
        {isOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <TreeNode
                key={child.path}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                setExpanded={setExpanded}
                selectedPath={selectedPath}
                onSelect={onSelect}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isActive = node.path === selectedPath;
  return (
    <button
      onClick={() => onSelect(node.path)}
      className={cn(
        "flex w-full items-center gap-1 rounded px-1.5 py-1 text-left text-[13px] transition-colors",
        isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
      )}
      style={{ paddingLeft: depth * 12 + 22 }}
    >
      <FileIconFor ext={node.file?.extension ?? ""} className="h-3.5 w-3.5 shrink-0" />
      <span className="truncate">{node.name}</span>
    </button>
  );
}

function FileDetail({ file }: { file: WorkspaceFile }) {
  const { getDependencies, getDependents } = useDependencyStore();
  const { pinnedFiles, togglePin } = useContextStore();
  const [copied, setCopied] = React.useState(false);
  const isPinned = pinnedFiles.includes(file.path);
  const deps = getDependencies(file.path);
  const dependents = getDependents(file.path);

  const copyPath = () => {
    navigator.clipboard.writeText(file.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
        <FileIconFor ext={file.extension} className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate font-mono text-sm font-medium text-foreground">{file.path}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { togglePin(file.path); toast.success(isPinned ? "Unpinned" : "Pinned"); }}
            aria-label="Pin file"
          >
            {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={copyPath} aria-label="Copy path">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {/* File metadata */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <MetaTile label="Language" value={file.language} />
          <MetaTile label="Lines" value={file.lines} />
          <MetaTile label="Size" value={`${file.size}B`} />
          <MetaTile label="Tokens" value={file.tokenEstimate} />
        </div>

        {/* Symbols */}
        <DetailSection icon={Boxes} title="Symbols" count={file.symbols.length}>
          {file.symbols.length === 0 ? (
            <p className="text-xs text-muted-foreground">No symbols detected.</p>
          ) : (
            <div className="space-y-1">
              {file.symbols.map((s, i) => (
                <SymbolRow key={i} symbol={s} />
              ))}
            </div>
          )}
        </DetailSection>

        {/* Imports */}
        <DetailSection icon={ArrowDownToLine} title="Imports" count={file.imports.length}>
          {file.imports.length === 0 ? (
            <p className="text-xs text-muted-foreground">No imports.</p>
          ) : (
            <div className="space-y-0.5">
              {file.imports.map((imp, i) => (
                <div key={i} className="flex items-center gap-2 rounded px-1.5 py-0.5 text-xs hover:bg-muted/40">
                  <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", imp.relative ? "bg-emerald-500" : "bg-amber-500")} />
                  <span className="truncate font-mono text-foreground">{imp.uri}</span>
                  {imp.alias && <Badge variant="outline" className="text-[9px]">as {imp.alias}</Badge>}
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Exports */}
        <DetailSection icon={ArrowUpFromLine} title="Exports" count={file.exports.length}>
          {file.exports.length === 0 ? (
            <p className="text-xs text-muted-foreground">No exports.</p>
          ) : (
            <div className="space-y-0.5">
              {file.exports.map((exp, i) => (
                <div key={i} className="font-mono text-xs text-foreground">{exp.uri}</div>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Dependencies (graph) */}
        <DetailSection icon={Network} title="Dependencies" count={deps.length}>
          {deps.length === 0 ? (
            <p className="text-xs text-muted-foreground">No outgoing dependencies.</p>
          ) : (
            <div className="space-y-0.5">
              {deps.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[9px]">{e.kind}</Badge>
                  <span className="truncate font-mono text-foreground">{e.to}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>

        {/* Dependents (reverse) */}
        <DetailSection icon={Network} title="Referenced By" count={dependents.length}>
          {dependents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No incoming references.</p>
          ) : (
            <div className="space-y-0.5">
              {dependents.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className="text-[9px]">{e.kind}</Badge>
                  <span className="truncate font-mono text-foreground">{e.from}</span>
                </div>
              ))}
            </div>
          )}
        </DetailSection>
      </div>
    </div>
  );
}

function MetaTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
      <div className="text-sm font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.ElementType;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">{title}</span>
        <Badge variant="outline" className="ml-auto text-[9px]">{count}</Badge>
      </div>
      {children}
    </div>
  );
}

function SymbolRow({ symbol }: { symbol: SymbolRef }) {
  const meta = symbolKindMeta[symbol.kind];
  return (
    <div className="flex items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/40">
      <span className={cn("flex h-5 w-14 shrink-0 items-center justify-center rounded text-[9px] font-medium uppercase", meta.color)}>
        {meta.label}
      </span>
      <span className="font-medium text-foreground">{symbol.name}</span>
      {symbol.widgetArchetype && (
        <Badge variant="outline" className="text-[9px]">{symbol.widgetArchetype}</Badge>
      )}
      {symbol.modifiers.length > 0 && (
        <span className="text-[10px] text-muted-foreground">{symbol.modifiers.join(" ")}</span>
      )}
      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">L{symbol.line}</span>
    </div>
  );
}
