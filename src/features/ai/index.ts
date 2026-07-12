/**
 * @module features/ai
 *
 * AI capability layer for FlutterForge AI. This barrel re-exports the public
 * surface of every AI sub-module. Phase 1 ships only the contracts; the
 * implementation arrives in Phase 2.
 *
 * Sub-modules:
 *  - agent/    Conversational coding agent (planner, executor, reviewer)
 *  - models/   Model manager — provider routing, capability negotiation
 *  - mcp/      Model Context Protocol client (tools, resources, prompts)
 *
 * Design principle: the rest of the app depends ONLY on this barrel, never on
 * a specific provider. Swapping OpenRouter for Ollama (or a local model)
 * must not touch feature code.
 */

export * from "./agent";
export * from "./models";
export * from "./mcp";
