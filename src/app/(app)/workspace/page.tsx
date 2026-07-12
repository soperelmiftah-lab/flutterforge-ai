"use client";

import * as React from "react";
import {
  ResizablePanel as Panel,
  ResizablePanelGroup as PanelGroup,
  ResizableHandle as PanelResizeHandle,
} from "@/components/ui/resizable";
import { FileExplorer } from "@/components/explorer/file-explorer";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { CodeEditor } from "@/components/editor/code-editor";
import { WorkspaceToolbar } from "@/components/workspace/workspace-toolbar";
import { RightPanel } from "@/components/workspace/right-panel";
import { BottomPanel } from "@/components/workspace/bottom-panel";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

/**
 * Workspace page — the IDE surface. Three-column resizable split
 * (Explorer · Editor · Preview/Chat) with an optional collapsible bottom panel.
 * Uses `fill` mode so the page owns its full height without page-level scroll.
 */
export default function WorkspacePage() {
  const { rightPanelOpen, bottomPanelOpen } = useUIStore();
  const [rightTab, setRightTab] = React.useState<"preview" | "chat">("preview");

  return (
    <div className="flex h-full flex-col bg-background">
      <PanelGroup direction="horizontal" className="min-h-0 flex-1">
        {/* Explorer */}
        <Panel defaultSize={18} minSize={12} maxSize={32} order={1}>
          <FileExplorer />
        </Panel>
        <ResizeHandle />

        {/* Editor area (with optional bottom panel) */}
        <Panel order={2} minSize={30} defaultSize={rightPanelOpen ? 54 : 82}>
          <div className="flex h-full flex-col">
            <WorkspaceToolbar rightTab={rightTab} onRightTabChange={setRightTab} />
            <EditorTabs />
            <PanelGroup direction="vertical" className="min-h-0 flex-1">
              <Panel defaultSize={bottomPanelOpen ? 70 : 100} minSize={20} order={1}>
                <CodeEditor />
              </Panel>
              {bottomPanelOpen && (
                <>
                  <ResizeHandle direction="vertical" />
                  <Panel defaultSize={30} minSize={10} maxSize={70} order={2}>
                    <BottomPanel />
                  </Panel>
                </>
              )}
            </PanelGroup>
          </div>
        </Panel>

        {/* Right panel: Preview / AI Chat */}
        {rightPanelOpen && (
          <>
            <ResizeHandle />
            <Panel defaultSize={28} minSize={18} maxSize={45} order={3}>
              <RightPanel tab={rightTab} onTabChange={setRightTab} />
            </Panel>
          </>
        )}
      </PanelGroup>
    </div>
  );
}

function ResizeHandle({ direction = "horizontal" }: { direction?: "horizontal" | "vertical" }) {
  return (
    <PanelResizeHandle
      className={cn(
        "relative group flex items-center justify-center transition-colors",
        direction === "horizontal"
          ? "w-px bg-border hover:bg-primary/50"
          : "h-px bg-border hover:bg-primary/50"
      )}
    >
      <div
        className={cn(
          "absolute rounded-full bg-transparent transition-colors group-hover:bg-primary/20",
          direction === "horizontal" ? "h-10 w-1" : "h-1 w-10"
        )}
      />
    </PanelResizeHandle>
  );
}
