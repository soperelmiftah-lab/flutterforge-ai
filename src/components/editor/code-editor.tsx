"use client";

import * as React from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { useEditorStore, useSettingsStore } from "@/stores";
import { ComingSoon } from "@/components/common/coming-soon";
import { Code2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/** Map our editor theme names to Monaco's built-in theme keys (fallback). */
const themeMap: Record<string, string> = {
  "forge-dark": "forge-dark",
  "vs-dark": "vs-dark",
  "forge-light": "forge-light",
  light: "light",
};

/**
 * CodeEditor — Monaco wrapper bound to the editor store. Reads/writes the
 * active tab's content, honors settings (font size, word wrap, minimap,
 * line numbers, tab size), and provides a save shortcut (Cmd/Ctrl+S).
 */
export function CodeEditor() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const updateContent = useEditorStore((s) => s.updateContent);
  const saveTab = useEditorStore((s) => s.saveTab);
  const settings = useSettingsStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);
  const editorRef = React.useRef<Parameters<OnMount>[0] | null>(null);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    // Define a Forge dark theme with emerald accent.
    monaco.editor.defineTheme("forge-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "5b6b73", fontStyle: "italic" },
        { token: "keyword", foreground: "34d399" },
        { token: "string", foreground: "fbbf24" },
        { token: "number", foreground: "f472b6" },
        { token: "type", foreground: "60a5fa" },
      ],
      colors: {
        "editor.background": "#0f1117",
        "editor.foreground": "#e6edf3",
        "editorLineNumber.foreground": "#3b4252",
        "editorLineNumber.activeForeground": "#34d399",
        "editor.selectionBackground": "#10b98133",
        "editor.lineHighlightBackground": "#1a1f29",
        "editorCursor.foreground": "#34d399",
        "editorIndentGuide.background1": "#1f2430",
        "editorWidget.background": "#161922",
      },
    });
    monaco.editor.defineTheme("forge-light", {
      base: "vs",
      inherit: true,
      rules: [
        { token: "keyword", foreground: "0d9488" },
        { token: "string", foreground: "d97706" },
        { token: "number", foreground: "db2777" },
      ],
      colors: {
        "editor.background": "#ffffff",
        "editor.foreground": "#1f2937",
        "editorCursor.foreground": "#0d9488",
      },
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const id = useEditorStore.getState().activeTabId;
      if (id) {
        useEditorStore.getState().saveTab(id);
        toast.success("File saved");
      }
    });
  };

  if (!activeTab) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <ComingSoon
          icon={Code2}
          title="No file open"
          description="Select a file from the explorer to start editing. Your changes save locally."
          badge="Workspace"
        />
      </div>
    );
  }

  const resolvedTheme = themeMap[settings.editorTheme] ?? "forge-dark";

  return (
    <div className="relative h-full w-full bg-background">
      <Editor
        height="100%"
        path={activeTab.path}
        language={activeTab.language}
        value={activeTab.content}
        theme={resolvedTheme}
        onMount={handleMount}
        onChange={(value) => updateContent(activeTab.id, value ?? "")}
        loading={<div className="p-4 text-sm text-muted-foreground">Loading editor…</div>}
        options={{
          fontSize: settings.fontSize,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontLigatures: true,
          minimap: { enabled: settings.minimap },
          lineNumbers: settings.lineNumbers ? "on" : "off",
          wordWrap: settings.wordWrap ? "on" : "off",
          tabSize: settings.tabSize,
          smoothScrolling: true,
          cursorBlinking: "smooth",
          cursorSmoothCaretAnimation: "on",
          roundedSelection: true,
          scrollBeyondLastLine: false,
          renderLineHighlight: "all",
          padding: { top: 14, bottom: 14 },
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          automaticLayout: true,
        }}
      />
      {/* Floating save button for dirty files */}
      {activeTab.dirty && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button
            size="sm"
            onClick={() => {
              saveTab(activeTab.id);
              toast.success("File saved");
            }}
            className="shadow-lg"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" /> Save
            <kbd className="ml-2 rounded bg-primary-foreground/20 px-1 py-0.5 font-mono text-[10px]">
              ⌘S
            </kbd>
          </Button>
        </div>
      )}
    </div>
  );
}
