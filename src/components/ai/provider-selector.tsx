"use client";

import * as React from "react";
import { Check, ChevronDown, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useProviderStore } from "@/stores/provider-store";
import { useAIStore } from "@/stores/ai-store";
import type { ProviderId } from "@/features/ai/provider/types";
import { cn } from "@/lib/utils";

interface ProviderSelectorProps {
  className?: string;
  compact?: boolean;
}

/**
 * Provider selector — dropdown to choose the active AI provider. Shows
 * implementation status and whether an API key is configured.
 */
export function ProviderSelector({ className, compact }: ProviderSelectorProps) {
  const providers = useProviderStore((s) => s.providers);
  const credentials = useProviderStore((s) => s.credentials);
  const current = useAIStore((s) => s.provider);
  const setProvider = useAIStore((s) => s.setProvider);

  const currentMeta = providers.find((p) => p.id === current);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn("justify-between gap-2", className)}
        >
          <span className="flex items-center gap-2">
            <span className="text-base">{currentMeta?.icon ?? "🤖"}</span>
            {!compact && <span>{currentMeta?.name ?? "Select provider"}</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">AI Provider</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {providers.map((p) => {
          const cred = credentials[p.id];
          const isActive = p.id === current;
          return (
            <DropdownMenuItem
              key={p.id}
              onClick={() => setProvider(p.id as ProviderId)}
              className="flex items-start gap-2 py-2"
            >
              <span className="mt-0.5 text-base">{p.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium">{p.name}</span>
                  {isActive && <Check className="h-3 w-3 text-primary" />}
                </div>
                {!compact && (
                  <p className="text-[10px] text-muted-foreground line-clamp-1">
                    {p.description}
                  </p>
                )}
                <div className="mt-0.5 flex items-center gap-1">
                  {p.isBuiltIn && (
                    <Badge variant="secondary" className="h-4 text-[9px] gap-0.5">
                      <Zap className="h-2.5 w-2.5" /> Built-in
                    </Badge>
                  )}
                  {p.requiresApiKey && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-4 text-[9px]",
                        cred?.hasKey
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {cred?.hasKey ? "Key set" : "No key"}
                    </Badge>
                  )}
                  {!p.implemented && (
                    <Badge variant="outline" className="h-4 text-[9px] text-muted-foreground">
                      Soon
                    </Badge>
                  )}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
