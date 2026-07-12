/**
 * @module features/ai
 *
 * FlutterForge AI Core — the brain of the application.
 *
 * This barrel re-exports the full public surface of the AI Core. Every future
 * AI feature (chat, agents, generators, debug, review) imports from here —
 * never from a sub-module directly. This keeps the dependency graph clean
 * and makes it possible to swap implementations without touching consumers.
 *
 * Architecture overview (see docs/AI_ARCHITECTURE.md for details):
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │                    AI Core                              │
 *   │                                                         │
 *   │   provider/    AIProvider interface + 9 implementations │
 *   │   models/      dynamic model registry + free/paid filter│
 *   │   chat/        universal chat engine                    │
 *   │   stream/      SSE streaming (server + client helpers)  │
 *   │   memory/      conversation, context, pinned, summary   │
 *   │   prompt/      system, flutter, workspace prompt builder│
 *   │   tokens/      token estimation + usage tracking        │
 *   │   context/     context-window manager                   │
 *   │   tools/       tool-calling contracts (Phase 3)         │
 *   │   settings/    AI settings types                        │
 *   │   registry/    encrypted credential store               │
 *   │   agents/      agent contracts (Phase 3+)               │
 *   │   errors.ts    unified AIError hierarchy                │
 *   └─────────────────────────────────────────────────────────┘
 *
 * Provider flow:
 *   UI → Zustand stores → API routes → chat engine → provider → AI vendor
 *                                                            ↓
 *   UI ← Zustand stores ← API routes (SSE) ← stream ← provider ← AI vendor
 */

// Provider abstraction
export * from "./provider";

// Model registry
export * from "./models";

// Chat engine
export * from "./chat";

// Streaming
export * from "./stream";

// Memory system
export * from "./memory";

// Prompt system
export * from "./prompt";

// Token engine
export * from "./tokens";

// Context manager
export * from "./context";

// Tool calling contracts
export * from "./tools";

// AI settings
export * from "./settings";

// Credential store
export * from "./registry";

// Agent contracts
export * from "./agents";

// Error hierarchy
export * from "./errors";

// MCP (kept from Phase 1 — re-exported for backward compat)
export * from "./mcp";
