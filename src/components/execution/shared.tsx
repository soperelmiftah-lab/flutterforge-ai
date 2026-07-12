"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { DiffHunk, DiffLine, Patch, RiskLevel } from "@/features/execution/types";
import { RISK_LEVEL_META } from "@/features/execution/types";

/** Risk level badge. */
export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_LEVEL_META[level];
  return (
    <Badge variant="outline" className={cn("text-[9px] uppercase", meta.color, className)}>
      {meta.label}
    </Badge>
  );
}

/** Status badge with color. */
export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    queued: "bg-muted text-muted-foreground",
    "pending-approval": "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    approved: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    running: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    success: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    failed: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    cancelled: "bg-muted text-muted-foreground",
    "rolled-back": "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  };
  return (
    <Badge variant="outline" className={cn("text-[9px] uppercase", colors[status] ?? colors.queued)}>
      {status}
    </Badge>
  );
}

/** Category badge with icon. */
export function CategoryBadge({ category }: { category: string }) {
  const icons: Record<string, string> = {
    filesystem: "📁",
    editor: "✏️",
    search: "🔍",
    flutter: "🐦",
    git: "🌿",
    terminal: "⌨️",
  };
  return (
    <Badge variant="outline" className="gap-1 text-[9px] capitalize">
      <span>{icons[category] ?? "🔧"}</span>
      {category}
    </Badge>
  );
}

/** Diff viewer — renders a patch as a side-by-side or inline diff. */
export function DiffViewer({
  patch,
  mode = "inline",
  className,
}: {
  patch: Patch;
  mode?: "inline" | "split";
  className?: string;
}) {
  if (mode === "split") {
    return <SplitDiff patch={patch} className={className} />;
  }
  return <InlineDiff patch={patch} className={className} />;
}

/** Inline diff (single column, +/- prefixes). */
function InlineDiff({ patch, className }: { patch: Patch; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border bg-background font-mono text-xs", className)}>
      <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
        {patch.path} · {patch.hunks.length} hunk(s)
      </div>
      <div className="ff-scroll max-h-[400px] overflow-y-auto">
        {patch.hunks.map((hunk, i) => (
          <HunkView key={i} hunk={hunk} mode="inline" />
        ))}
      </div>
    </div>
  );
}

/** Split diff (two columns: before | after). */
function SplitDiff({ patch, className }: { patch: Patch; className?: string }) {
  return (
    <div className={cn("overflow-x-auto rounded-md border border-border bg-background font-mono text-xs", className)}>
      <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-[10px] text-muted-foreground">
        {patch.path} · {patch.hunks.length} hunk(s)
      </div>
      <div className="ff-scroll max-h-[400px] overflow-y-auto">
        {patch.hunks.map((hunk, i) => (
          <HunkView key={i} hunk={hunk} mode="split" />
        ))}
      </div>
    </div>
  );
}

function HunkView({ hunk, mode }: { hunk: DiffHunk; mode: "inline" | "split" }) {
  if (mode === "split") {
    const leftLines = hunk.lines.filter((l) => l.type === "context" || l.type === "delete");
    const rightLines = hunk.lines.filter((l) => l.type === "context" || l.type === "add");
    return (
      <div>
        <div className="border-b border-border bg-muted/20 px-3 py-0.5 text-[10px] text-muted-foreground">
          @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
        </div>
        <div className="grid grid-cols-2">
          <div className="border-r border-border">
            {leftLines.map((line, i) => (
              <DiffLineView key={i} line={line} side="left" />
            ))}
          </div>
          <div>
            {rightLines.map((line, i) => (
              <DiffLineView key={i} line={line} side="right" />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="border-b border-border bg-muted/20 px-3 py-0.5 text-[10px] text-muted-foreground">
        @@ -{hunk.oldStart},{hunk.oldLines} +{hunk.newStart},{hunk.newLines} @@
      </div>
      {hunk.lines.map((line, i) => (
        <DiffLineView key={i} line={line} side="inline" />
      ))}
    </div>
  );
}

function DiffLineView({ line, side }: { line: DiffLine; side: "left" | "right" | "inline" }) {
  const bg =
    line.type === "add"
      ? "bg-emerald-500/10"
      : line.type === "delete"
        ? "bg-rose-500/10"
        : "";
  const prefix = side === "inline" ? (line.type === "add" ? "+" : line.type === "delete" ? "-" : " ") : "";
  const num = side === "left" ? line.oldNumber : side === "right" ? line.newNumber : line.newNumber ?? line.oldNumber;
  return (
    <div className={cn("flex", bg)}>
      <span className="w-10 shrink-0 select-none border-r border-border px-1 text-right text-[9px] text-muted-foreground">
        {num ?? ""}
      </span>
      <span className="w-4 shrink-0 select-none px-1 text-muted-foreground">{prefix}</span>
      <span className="whitespace-pre px-1 text-foreground">{line.content}</span>
    </div>
  );
}

/** Metric tile. */
export function Metric({ label, value, sub, className }: { label: string; value: string | number; sub?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

/** Empty state. */
export function EmptyState({ icon, title, description }: { icon?: React.ElementType; title: string; description?: string }) {
  const Icon = icon;
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {Icon && (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
