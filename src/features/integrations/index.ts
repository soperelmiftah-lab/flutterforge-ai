/**
 * @module features/integrations
 *
 * Third-party integration adapters. Each adapter is isolated so enabling/
 * disabling a provider never affects the others. Phase 1 ships contracts only;
 * Phase 2-4 implement them.
 */

export * from "./openrouter";
export * from "./ollama";
export * from "./firebase";
export * from "./supabase";
export * from "./github";
