/**
 * Barrel export for all Zustand stores. Importing from "@/stores" keeps feature
 * modules decoupled from individual store file locations.
 */
export { useSettingsStore, defaultSettings } from "./settings-store";
export { useUIStore } from "./ui-store";
export { useProjectStore } from "./project-store";
export { useEditorStore, flattenFiles } from "./editor-store";
export { useWorkspaceStore } from "./workspace-store";
// Phase 2 — AI Core stores
export { useAIStore } from "./ai-store";
export { useProviderStore } from "./provider-store";
export { useModelStore } from "./model-store";
export { useChatStore } from "./chat-store";
export { useTokenStore } from "./token-store";
