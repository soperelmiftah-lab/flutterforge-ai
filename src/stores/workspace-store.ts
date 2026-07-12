import { create } from "zustand";
import type { ActivityEvent, ChatSession } from "@/lib/types";
import { mockActivity, mockChatSessions } from "@/lib/mock-data";

/**
 * Workspace store — cross-cutting workspace state: recent activity feed,
 * chat sessions, and the currently active workspace context. Bridges the
 * editor, project, and (future) AI modules.
 */
interface WorkspaceState {
  activity: ActivityEvent[];
  chatSessions: ChatSession[];
  activeProjectId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setActiveProject: (id: string | null) => void;
  addActivity: (event: ActivityEvent) => void;
  clearActivity: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  activity: [],
  chatSessions: [],
  activeProjectId: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({
      activity: mockActivity,
      chatSessions: mockChatSessions,
      hydrated: true,
    });
  },
  setActiveProject: (activeProjectId) => set({ activeProjectId }),
  addActivity: (event) =>
    set((s) => ({ activity: [event, ...s.activity].slice(0, 50) })),
  clearActivity: () => set({ activity: [] }),
}));
