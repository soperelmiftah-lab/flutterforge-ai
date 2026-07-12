import { create } from "zustand";
import type { Project, ProjectStatus } from "@/lib/types";
import { mockProjects } from "@/lib/mock-data";
import { uid } from "@/lib/utils";

/**
 * Project store — the canonical client-side project collection. In phase 1
 * this hydrates from mock data; future phases will sync with the API and
 * React Query cache.
 */
interface ProjectState {
  projects: Project[];
  selectedId: string | null;
  hydrated: boolean;
  hydrate: () => void;
  select: (id: string | null) => void;
  create: (input: {
    name: string;
    description: string;
    framework: string;
    template?: string;
  }) => Project;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  setStatus: (id: string, status: ProjectStatus) => void;
  touch: (id: string) => void;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedId: null,
  hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    set({ projects: mockProjects, hydrated: true });
  },
  select: (id) => set({ selectedId: id }),
  create: (input) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: uid("prj"),
      name: input.name,
      description: input.description,
      framework: input.framework,
      status: "draft",
      favorite: false,
      color: "emerald",
      lastOpenedAt: now,
      createdAt: now,
      updatedAt: now,
      filesCount: 1,
      collaborators: 1,
    };
    set((s) => ({ projects: [project, ...s.projects] }));
    return project;
  },
  rename: (id, name) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
      ),
    })),
  remove: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),
  toggleFavorite: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, favorite: !p.favorite } : p
      ),
    })),
  setStatus: (id, status) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
      ),
    })),
  touch: (id) =>
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id
          ? { ...p, lastOpenedAt: new Date().toISOString() }
          : p
      ),
    })),
}));
