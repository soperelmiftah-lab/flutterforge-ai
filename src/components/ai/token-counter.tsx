"use client";

import { Coins, TrendingUp, Gauge } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/features/ai/tokens/counter";
import type { TokenUsage } from "@/features/ai/tokens/types";

interface TokenCounterProps {
  usage: TokenUsage | null;
  contextLength?: number;
  sessionTotal?: number;
  className?: string;
  compact?: boolean;
}

/**
 * Token counter — displays input/output/total tokens and context usage.
 * Shown in the chat UI and AI settings.
 */
export function TokenCounter({
  usage,
  contextLength,
  sessionTotal,
  className,
  compact,
}: TokenCounterProps) {
  const total = sessionTotal ?? usage?.totalTokens ?? 0;
  const inputTokens = usage?.inputTokens ?? 0;
  const outputTokens = usage?.outputTokens ?? 0;
  const usagePercent = contextLength
    ? Math.min(100, (total / contextLength) * 100)
    : 0;

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1 text-xs text-muted-foreground", className)}>
        <Coins className="h-3 w-3" />
        {formatTokens(total)} tokens
      </span>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="grid grid-cols-3 gap-2">
        <Stat icon={TrendingUp} label="Input" value={formatTokens(inputTokens)} />
        <Stat icon={Coins} label="Output" value={formatTokens(outputTokens)} />
        <Stat icon={Gauge} label="Total" value={formatTokens(total)} />
      </div>
      {contextLength && (
        <div>
          <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>Context usage</span>
            <span>
              {formatTokens(total)} / {formatTokens(contextLength)} ({usagePercent.toFixed(1)}%)
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                usagePercent > 80 ? "bg-rose-500" : usagePercent > 50 ? "bg-amber-500" : "bg-primary"
              )}
              style={{ width: `${usagePercent}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Coins;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5">
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Icon className="h-2.5 w-2.5" />
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}
