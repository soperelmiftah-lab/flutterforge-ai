"use client";

import * as React from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { AppStatusbar } from "@/components/layout/app-statusbar";
import { CommandPalette } from "@/components/layout/command-palette";
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";
import { useProjectStore, useEditorStore, useWorkspaceStore } from "@/stores";

/**
 * AppShell — the persistent application frame (sidebar + topbar + status bar)
 * shared by every protected route. Hydrates mock data stores once on mount so
 * all child pages render fully populated without per-page bootstrapping.
 *
 * Uses min-h-screen + flex-col so the status bar (footer) sticks to the
 * viewport bottom on short content and is pushed down naturally on long pages.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const hydrateProjects = useProjectStore((s) => s.hydrate);
  const hydrateEditor = useEditorStore((s) => s.hydrate);
  const hydrateWorkspace = useWorkspaceStore((s) => s.hydrate);

  React.useEffect(() => {
    hydrateProjects();
    hydrateEditor();
    hydrateWorkspace();
  }, [hydrateProjects, hydrateEditor, hydrateWorkspace]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar />
        {/* main is a fixed-height flex child; pages own their scrolling */}
        <main className="relative min-h-0 flex-1 overflow-hidden">{children}</main>
        <AppStatusbar />
      </div>
      <CommandPalette />
      <KeyboardShortcuts />
    </div>
  );
}
