"use client";

import { Loader2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreamingIndicatorProps {
  active: boolean;
  className?: string;
}

/** Animated streaming indicator — shown while the AI is generating a response. */
export function StreamingIndicator({ active, className }: StreamingIndicatorProps) {
  if (!active) return null;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-primary", className)}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
      </span>
      Streaming…
    </span>
  );
}

interface ConnectionStatusProps {
  status: "healthy" | "degraded" | "down" | "unconfigured";
  className?: string;
}

/** Connection status badge for the active provider. */
export function ConnectionStatus({ status, className }: ConnectionStatusProps) {
  const config = {
    healthy: { label: "Connected", color: "text-emerald-500", dot: "bg-emerald-500" },
    degraded: { label: "Degraded", color: "text-amber-500", dot: "bg-amber-500" },
    down: { label: "Offline", color: "text-rose-500", dot: "bg-rose-500" },
    unconfigured: { label: "Not configured", color: "text-muted-foreground", dot: "bg-muted-foreground" },
  }[status];

  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs", config.color, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}
