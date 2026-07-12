import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, Loader2, Archive, AlertCircle } from "lucide-react";
import type { ProjectStatus } from "@/lib/types";

const statusConfig: Record<
  ProjectStatus,
  { label: string; className: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
    icon: Clock,
  },
  active: {
    label: "Active",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  building: {
    label: "Building",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    icon: Loader2,
  },
  archived: {
    label: "Archived",
    className: "bg-zinc-500/15 text-zinc-500 dark:text-zinc-400",
    icon: Archive,
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  const cfg = statusConfig[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        cfg.className,
        className
      )}
    >
      <Icon className={cn("h-3 w-3", status === "building" && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

export function AlertBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-xs font-medium text-rose-600 dark:text-rose-400",
        className
      )}
    >
      <AlertCircle className="h-3 w-3" />
      {children}
    </span>
  );
}
