/**
 * Barrel export for all Zustand stores. Importing from "@/stores" keeps feature
 * modules decoupled from individual store file locations.
 */
export { useSettingsStore, defaultSettings } from "./settings-store";
export { useUIStore } from "./ui-store";
export { useProjectStore } from "./project-store";
export { useEditorStore, flattenFiles } from "./editor-store";
export { useWorkspaceStore } from "./workspace-store";
