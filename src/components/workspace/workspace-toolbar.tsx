"use client";

import * as React from "react";
import {
  Play,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Square,
  ChevronRight,
  GitBranch,
  Save,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEditorStore, useProjectStore, useUIStore } from "@/stores";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Device = "mobile" | "tablet" | "desktop";
type RightTab = "preview" | "chat";

interface WorkspaceToolbarProps {
  rightTab: RightTab;
  onRightTabChange: (t: RightTab) => void;
}

/**
 * Workspace toolbar — sits above the editor. Breadcrumbs, run/preview actions,
 * device selector (for the future preview engine), and save indicator.
 */
export function WorkspaceToolbar({ rightTab, onRightTabChange }: WorkspaceToolbarProps) {
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const tabs = useEditorStore((s) => s.tabs);
  const saveTab = useEditorStore((s) => s.saveTab);
  const saveAll = useEditorStore((s) => s.saveAll);
  const projects = useProjectStore((s) => s.projects);
  const selectedId = useProjectStore((s) => s.selectedId);
  const { toggleBottomPanel, bottomPanelOpen } = useUIStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const project =
    projects.find((p) => p.id === selectedId) ?? projects[0];
  const [device, setDevice] = React.useState<Device>("mobile");

  const crumbs = activeTab ? activeTab.path.split("/") : [];

  const dirtyCount = tabs.filter((t) => t.dirty).length;

  return (
    <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      {/* Breadcrumbs */}
      <div className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium text-foreground">{project?.name ?? "Workspace"}</span>
        {crumbs.length > 0 && <ChevronRight className="h-3 w-3" />}
        <span className="truncate">{crumbs.join(" / ")}</span>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Device selector (preview engine — placeholder) */}
        <div className="hidden items-center rounded-md border border-border bg-muted/30 p-0.5 sm:flex">
          {(["mobile", "tablet", "desktop"] as Device[]).map((d) => {
            const Icon = d === "mobile" ? Smartphone : d === "tablet" ? Tablet : Monitor;
            return (
              <button
                key={d}
                onClick={() => {
                  setDevice(d);
                  onRightTabChange("preview");
                }}
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded transition-colors",
                  device === d && rightTab === "preview"
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-label={`${d} preview`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => toast.info("Live preview arrives in Phase 3.")}
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Hot reload
        </Button>

        <Button
          size="sm"
          className="h-7"
          onClick={() => toast.info("Build & run arrives in Phase 3.")}
        >
          <Play className="mr-1.5 h-3.5 w-3.5" /> Run
        </Button>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (activeTab?.dirty) {
              saveTab(activeTab.id);
              toast.success("File saved");
            } else {
              saveAll();
              toast.success(dirtyCount ? `Saved ${dirtyCount} files` : "All files saved");
            }
          }}
          aria-label="Save"
        >
          <Save className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7", bottomPanelOpen && "text-primary")}
          onClick={toggleBottomPanel}
          aria-label="Toggle terminal"
        >
          <Terminal className="h-3.5 w-3.5" />
        </Button>

        {dirtyCount > 0 && (
          <Badge variant="outline" className="text-[10px] text-amber-600 dark:text-amber-400">
            {dirtyCount} unsaved
          </Badge>
        )}
      </div>

      {/* keep icon referenced for tree-shaking friendliness */}
      <span className="hidden">
        <Square />
      </span>
    </div>
  );
}
