import { create } from "zustand";
import type { EditorTab, ProjectFileNode } from "@/lib/types";
import { mockFileTree } from "@/lib/mock-data";
import { uid } from "@/lib/utils";

/** Flatten the file tree to a list of file nodes (for quick lookup). */
function flattenFiles(nodes: ProjectFileNode[]): ProjectFileNode[] {
  const out: ProjectFileNode[] = [];
  const walk = (ns: ProjectFileNode[]) => {
    for (const n of ns) {
      if (n.type === "file") out.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Deep clone with toggled/expanded state preserved per id. */
function cloneTree(nodes: ProjectFileNode[]): ProjectFileNode[] {
  return nodes.map((n) => ({
    ...n,
    children: n.children ? cloneTree(n.children) : undefined,
  }));
}

/**
 * Editor store — owns the file tree and open editor tabs. Decoupled from the
 * project store so the editor can operate on a virtual workspace without a
 * selected project (e.g. scratch buffers).
 */
interface EditorState {
  tree: ProjectFileNode[];
  expanded: Record<string, boolean>;
  tabs: EditorTab[];
  activeTabId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  toggleFolder: (id: string) => void;
  openFile: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateContent: (tabId: string, content: string) => void;
  saveTab: (tabId: string) => void;
  saveAll: () => void;
}

function findFile(
  nodes: ProjectFileNode[],
  fileId: string
): ProjectFileNode | undefined {
  for (const n of nodes) {
    if (n.id === fileId) return n;
    if (n.children) {
      const f = findFile(n.children, fileId);
      if (f) return f;
    }
  }
  return undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tree: [],
  expanded: {},
  tabs: [],
  activeTabId: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    const tree = cloneTree(mockFileTree);
    const expanded: Record<string, boolean> = {};
    const walk = (ns: ProjectFileNode[]) => {
      for (const n of ns) {
        if (n.type === "folder") {
          expanded[n.id] = n.expanded ?? false;
          if (n.children) walk(n.children);
        }
      }
    };
    walk(tree);
    // Open main.dart by default for a great first impression.
    const mainFile = findFile(tree, "file_main");
    set({ tree, expanded, hydrated: true });
    if (mainFile) {
      get().openFile(mainFile.id);
    }
  },
  toggleFolder: (id) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),
  openFile: (fileId) => {
    const { tree, tabs } = get();
    const file = findFile(tree, fileId);
    if (!file) return;
    const existing = tabs.find((t) => t.fileId === fileId);
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const tab: EditorTab = {
      id: uid("tab"),
      fileId,
      name: file.name,
      path: file.path,
      language: file.language ?? "plaintext",
      content: file.content ?? "",
      originalContent: file.content ?? "",
      dirty: false,
      active: true,
    };
    set({
      tabs: tabs.map((t) => ({ ...t, active: false })).concat(tab),
      activeTabId: tab.id,
    });
  },
  closeTab: (tabId) =>
    set((s) => {
      const idx = s.tabs.findIndex((t) => t.id === tabId);
      if (idx === -1) return s;
      const tabs = s.tabs.filter((t) => t.id !== tabId);
      let activeTabId = s.activeTabId;
      if (s.activeTabId === tabId) {
        const next = tabs[Math.min(idx, tabs.length - 1)] ?? null;
        activeTabId = next?.id ?? null;
      }
      return { tabs, activeTabId };
    }),
  setActiveTab: (tabId) =>
    set((s) => ({
      tabs: s.tabs.map((t) => ({ ...t, active: t.id === tabId })),
      activeTabId: tabId,
    })),
  updateContent: (tabId, content) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? { ...t, content, dirty: content !== t.originalContent }
          : t
      ),
    })),
  saveTab: (tabId) =>
    set((s) => ({
      tabs: s.tabs.map((t) =>
        t.id === tabId
          ? { ...t, originalContent: t.content, dirty: false }
          : t
      ),
    })),
  saveAll: () =>
    set((s) => ({
      tabs: s.tabs.map((t) => ({
        ...t,
        originalContent: t.content,
        dirty: false,
      })),
    })),
}));

// Re-export for convenience in components.
export { flattenFiles };
