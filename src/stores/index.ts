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
// Phase 3 — Workspace Intelligence stores
export { useWorkspaceIndexStore } from "./workspace-index-store";
export { useSearchStore } from "./search-store";
export { useDependencyStore } from "./dependency-store";
export { useContextStore } from "./context-store";
// Phase 4 — Execution Engine stores
export { useExecutionStore } from "./execution-store";
export { useToolStore } from "./tool-store";
export { useApprovalStore } from "./approval-store";
export { useHistoryStore } from "./history-store";
export { useQueueStore } from "./queue-store";
export { useTelemetryStore } from "./telemetry-store";
// Phase 5 — Planner OS stores
export { usePlannerStore } from "./planner-store";
export { useAgentStore } from "./agent-store";
export { useWorkflowStore } from "./workflow-store";
export { useTimelineStore } from "./timeline-store";
export { useSessionStore } from "./session-store";
export { usePlannerMetricsStore } from "./metrics-store";
// Phase 6 — Tool Intelligence stores
export { useToolIntelligenceStore, stepStatusColor } from "./tool-intelligence-store";
export { useTIMetricsStore } from "./ti-metrics-store";
// Phase 7 — Flutter Platform store
export { useFlutterPlatformStore } from "./flutter-platform-store";
// Phase 8 — Runtime store
export { useRuntimeStore } from "./runtime-store";
// Phase 9 — Visual Runtime store
export { useVisualRuntimeStore } from "./visual-runtime-store";
