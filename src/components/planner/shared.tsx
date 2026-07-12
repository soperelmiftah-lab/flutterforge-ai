"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { TaskStatus, TaskPriority } from "@/features/execution/types";
import type { AgentStatus } from "@/features/planner/types";

/** Task status badge. */
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    blocked: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    ready: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    scheduled: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    running: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    failed: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    skipped: "bg-muted text-muted-foreground",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cn("text-[9px] uppercase", colors[status] ?? colors.pending)}>{status}</Badge>;
}

/** Task priority badge. */
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const colors: Record<string, string> = {
    low: "bg-muted text-muted-foreground",
    normal: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    high: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    critical: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  };
  return <Badge variant="outline" className={cn("text-[9px] uppercase", colors[priority] ?? colors.normal)}>{priority}</Badge>;
}

/** Agent status badge. */
export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  const colors: Record<string, string> = {
    idle: "bg-muted text-muted-foreground",
    busy: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    error: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    offline: "bg-muted text-muted-foreground",
  };
  return <Badge variant="outline" className={cn("text-[9px] uppercase", colors[status] ?? colors.idle)}>{status}</Badge>;
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
      {Icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

/** Format duration in ms to a human label. */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
