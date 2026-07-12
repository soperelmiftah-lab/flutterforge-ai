/**
 * @module features/workspace-intelligence/memory
 *
 * Workspace Memory — remembers what the user is currently doing: current
 * project, current file, cursor location, open tabs, recent files, pinned
 * files, and recent searches. Persisted to localStorage.
 */

import type { WorkspaceMemory, WorkspacePath } from "@/features/workspace-intelligence/types";

const STORAGE_KEY = "flutterforge-workspace-memory";
const MAX_RECENTS = 20;
const MAX_SEARCHES = 20;

/** Load memory from localStorage. */
export function loadMemory(): WorkspaceMemory {
  if (typeof window === "undefined") return defaultMemory();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultMemory();
    return { ...defaultMemory(), ...JSON.parse(raw) };
  } catch {
    return defaultMemory();
  }
}

/** Save memory to localStorage. */
export function saveMemory(memory: WorkspaceMemory): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  } catch {
    // ignore quota errors
  }
}

/** Default empty memory. */
export function defaultMemory(): WorkspaceMemory {
  return {
    currentProjectId: null,
    currentFilePath: null,
    cursor: null,
    openTabs: [],
    recentFiles: [],
    pinnedFiles: [],
    recentSearches: [],
  };
}

/** Update helpers — return a new memory object (immutable). */
export const memoryActions = {
  setCurrentProject: (m: WorkspaceMemory, projectId: string | null): WorkspaceMemory => ({
    ...m,
    currentProjectId: projectId,
  }),

  setCurrentFile: (m: WorkspaceMemory, path: WorkspacePath | null): WorkspaceMemory => {
    const recentFiles = path
      ? [path, ...m.recentFiles.filter((p) => p !== path)].slice(0, MAX_RECENTS)
      : m.recentFiles;
    return { ...m, currentFilePath: path, recentFiles };
  },

  setCursor: (m: WorkspaceMemory, line: number, column: number): WorkspaceMemory => ({
    ...m,
    cursor: { line, column },
  }),

  openTab: (m: WorkspaceMemory, path: WorkspacePath): WorkspaceMemory => ({
    ...m,
    openTabs: m.openTabs.includes(path) ? m.openTabs : [...m.openTabs, path],
    currentFilePath: path,
    recentFiles: [path, ...m.recentFiles.filter((p) => p !== path)].slice(0, MAX_RECENTS),
  }),

  closeTab: (m: WorkspaceMemory, path: WorkspacePath): WorkspaceMemory => ({
    ...m,
    openTabs: m.openTabs.filter((p) => p !== path),
    currentFilePath: m.currentFilePath === path ? (m.openTabs[m.openTabs.length - 2] ?? null) : m.currentFilePath,
  }),

  pinFile: (m: WorkspaceMemory, path: WorkspacePath): WorkspaceMemory => ({
    ...m,
    pinnedFiles: m.pinnedFiles.includes(path) ? m.pinnedFiles : [...m.pinnedFiles, path],
  }),

  unpinFile: (m: WorkspaceMemory, path: WorkspacePath): WorkspaceMemory => ({
    ...m,
    pinnedFiles: m.pinnedFiles.filter((p) => p !== path),
  }),

  addRecentSearch: (m: WorkspaceMemory, query: string): WorkspaceMemory => {
    const q = query.trim();
    if (!q) return m;
    return {
      ...m,
      recentSearches: [q, ...m.recentSearches.filter((s) => s !== q)].slice(0, MAX_SEARCHES),
    };
  },

  clearRecentSearches: (m: WorkspaceMemory): WorkspaceMemory => ({
    ...m,
    recentSearches: [],
  }),
};
