export interface RoadmapPhase {
  phase: string;
  title: string;
  status: "done" | "active" | "planned";
  eta: string;
  items: string[];
}

/**
 * Public roadmap. Phase 1 is this release; subsequent phases describe the
 * future feature surface the architecture is designed to accommodate.
 */
export const roadmap: RoadmapPhase[] = [
  {
    phase: "Phase 1",
    title: "Foundation & Architecture",
    status: "active",
    eta: "Now",
    items: [
      "App shell, navigation & routing",
      "Monaco editor with tabs & theming",
      "File explorer with mock project tree",
      "Project & settings management",
      "Design system & state stores",
      "Modular package boundaries for future modules",
    ],
  },
  {
    phase: "Phase 2",
    title: "AI Coding Agent",
    status: "planned",
    eta: "Q2",
    items: [
      "Conversational AI coding agent",
      "Inline code suggestions & edits",
      "Context-aware file awareness",
      "Multi-model routing (OpenRouter, Ollama)",
    ],
  },
  {
    phase: "Phase 3",
    title: "Live Preview & Flutter Engine",
    status: "planned",
    eta: "Q3",
    items: [
      "Hot-reload web preview",
      "Android device preview bridge",
      "Flutter build engine service",
      "APK builder pipeline",
    ],
  },
  {
    phase: "Phase 4",
    title: "Multi-Agent & Integrations",
    status: "planned",
    eta: "Q4",
    items: [
      "Debug & review agents",
      "Multi-agent orchestration",
      "GitHub, Supabase & Firebase integrations",
      "Plugin system & MCP support",
    ],
  },
];
