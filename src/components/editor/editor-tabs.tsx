"use client";

import { X, Circle } from "lucide-react";
import { useEditorStore } from "@/stores";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Editor tab bar — open file tabs with active highlight, unsaved dot, and
 * close affordance. Mirrors the VSCode tab interaction model.
 */
export function EditorTabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 items-stretch overflow-x-auto border-b border-border bg-muted/20 ff-scroll">
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            role="tab"
            tabIndex={0}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") setActiveTab(tab.id);
            }}
            className={cn(
              "group flex min-w-0 cursor-pointer items-center gap-2 border-r border-border px-3 text-[13px] transition-colors",
              active
                ? "bg-background text-foreground"
                : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            )}
          >
            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", active ? "bg-primary" : "bg-transparent")} />
            <span className="truncate max-w-[160px]">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded transition-colors",
                tab.dirty
                  ? "text-muted-foreground hover:bg-muted"
                  : "text-transparent group-hover:text-muted-foreground hover:bg-muted",
                active && "text-muted-foreground"
              )}
              aria-label={`Close ${tab.name}`}
            >
              {tab.dirty ? (
                <Circle className="h-2.5 w-2.5 fill-current text-muted-foreground group-hover:hidden" />
              ) : null}
              <X className={cn("h-3 w-3", tab.dirty && "hidden group-hover:block")} />
            </button>
            {active && (
              <span className="absolute -mt-9 h-0.5 w-full translate-x-[-12px] bg-primary" aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

export { Button };
