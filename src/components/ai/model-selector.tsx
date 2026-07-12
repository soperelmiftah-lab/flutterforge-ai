"use client";

import * as React from "react";
import { Check, ChevronDown, Search, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useModelStore } from "@/stores/model-store";
import { useAIStore } from "@/stores/ai-store";
import { cn } from "@/lib/utils";
import { formatTokens } from "@/features/ai/tokens/counter";

interface ModelSelectorProps {
  className?: string;
  compact?: boolean;
}

/**
 * Model selector — searchable dropdown of models from the active provider(s).
 * Supports free/paid toggle and shows capability badges + context length.
 */
export function ModelSelector({ className, compact }: ModelSelectorProps) {
  const { models, loading, hydrate, filtered, showPaid, setShowPaid, query, setQuery, selectedModelId, selectModel } =
    useModelStore();
  const setModel = useAIStore((s) => s.setModel);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (models.length === 0 && !loading) hydrate();
  }, [models.length, loading, hydrate]);

  // Sync selected model to AI store
  React.useEffect(() => {
    if (selectedModelId) setModel(selectedModelId);
  }, [selectedModelId, setModel]);

  const selected = models.find((m) => m.id === selectedModelId);
  const list = filtered();

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={cn("justify-between gap-2 min-w-[160px]", className)}
        >
          <span className="flex items-center gap-1.5 truncate">
            <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate">{selected?.name ?? (loading ? "Loading…" : "Select model")}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        {/* Search */}
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              className="h-8 pl-8 text-sm"
              autoFocus
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <Label htmlFor="showpaid" className="text-xs text-muted-foreground cursor-pointer">
              Show paid models
            </Label>
            <Switch id="showpaid" checked={showPaid} onCheckedChange={setShowPaid} />
          </div>
        </div>

        {/* Model list */}
        <ScrollArea className="h-[300px]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && list.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No models found. {showPaid ? "Try a different search." : "Toggle paid models to see more."}
            </div>
          )}
          <div className="py-1">
            {list.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  selectModel(m.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-start gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/60",
                  m.id === selectedModelId && "bg-primary/5"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium truncate">{m.name}</span>
                    {m.id === selectedModelId && <Check className="h-3 w-3 text-primary shrink-0" />}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    {m.isFree ? (
                      <Badge variant="secondary" className="h-4 text-[9px] text-emerald-600 dark:text-emerald-400">
                        FREE
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="h-4 text-[9px]">
                        ${m.inputCostPer1M.toFixed(2)}/M
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatTokens(m.contextLength)} ctx
                    </span>
                    {m.capabilities.vision && (
                      <Badge variant="outline" className="h-4 text-[9px]">Vision</Badge>
                    )}
                    {m.capabilities.toolCalling && (
                      <Badge variant="outline" className="h-4 text-[9px]">Tools</Badge>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { formatTokens };
