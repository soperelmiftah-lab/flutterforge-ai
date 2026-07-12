"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/stores";
import { useEditorStore } from "@/stores";
import { toast } from "sonner";

/**
 * Global keyboard shortcuts. Mounted once in the AppShell. Handles:
 *
 *   Ctrl/Cmd + K         → command palette (everything)
 *   Ctrl/Cmd + P         → quick open file
 *   Ctrl/Cmd + Shift + P → commands only
 *   Ctrl/Cmd + B         → toggle sidebar
 *   Ctrl/Cmd + J         → toggle bottom panel
 *   Ctrl/Cmd + S         → save active file
 *   Ctrl/Cmd + Shift + F → search across project
 *   Alt + Shift + F      → format file (Phase 4 placeholder)
 *   F2                   → rename symbol (Phase 4 placeholder)
 *   F12                  → go to definition (Phase 4 placeholder)
 *
 * The palette shortcuts (K/P/Shift+P) are handled inside the CommandPalette
 * component to manage its own mode state.
 */
export function KeyboardShortcuts() {
  const router = useRouter();
  const { toggleSidebar, toggleBottomPanel, setCommandPaletteOpen, commandPaletteOpen } = useUIStore();
  const { activeTabId, tabs, saveTab } = useEditorStore();

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;

      // Ctrl/Cmd + B — toggle sidebar (works even while typing)
      if (mod && e.key.toLowerCase() === "b") {
        e.preventDefault();
        toggleSidebar();
        return;
      }

      // Ctrl/Cmd + J — toggle bottom panel
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        toggleBottomPanel();
        return;
      }

      // Ctrl/Cmd + S — save active file
      if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab?.dirty) {
          saveTab(activeTab.id);
          toast.success("File saved");
        } else {
          toast.info("Nothing to save");
        }
        return;
      }

      // Don't interfere with typing for the rest.
      if (isTyping) return;

      // Ctrl/Cmd + Shift + F — project search (go to inspector search tab)
      if (mod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        router.push("/inspector");
        return;
      }

      // Alt + Shift + F — format (Phase 4)
      if (e.altKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        toast.info("Dart formatter arrives in Phase 4");
        return;
      }

      // F2 — rename symbol (Phase 4)
      if (e.key === "F2") {
        e.preventDefault();
        toast.info("Rename symbol arrives in Phase 4");
        return;
      }

      // F12 — go to definition (Phase 4)
      if (e.key === "F12") {
        e.preventDefault();
        toast.info("Go to definition arrives in Phase 4");
        return;
      }

      // Ctrl/Cmd + K — toggle command palette (if not already handled by palette)
      if (mod && e.key.toLowerCase() === "k" && !e.shiftKey) {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
        return;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleSidebar, toggleBottomPanel, setCommandPaletteOpen, commandPaletteOpen, activeTabId, tabs, saveTab, router]);

  return null;
}
