/**
 * @module features/ai/provider/metas
 *
 * Static provider metadata. This file has NO imports of provider implementations
 * (only types), so it's safe to import from client components without pulling
 * in server-only dependencies like z-ai-web-dev-sdk.
 */

import type { ProviderId, ProviderMeta } from "./types";

/** All provider metadata, keyed by id. */
export const providerMetas: Record<ProviderId, ProviderMeta> = {
  forge: {
    id: "forge",
    name: "Forge (Built-in)",
    description:
      "Zero-config built-in provider. Works immediately without an API key — perfect for trying FlutterForge AI.",
    requiresApiKey: false,
    isBuiltIn: true,
    implemented: true,
    icon: "⚡",
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description:
      "Multi-vendor gateway with hundreds of models including a rich free tier. Default provider for FlutterForge AI.",
    requiresApiKey: true,
    isBuiltIn: false,
    baseUrl: "https://openrouter.ai/api/v1",
    keyUrl: "https://openrouter.ai/keys",
    implemented: true,
    icon: "🌐",
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4.1, o-series and embedding models. Requires an OpenAI API key.",
    requiresApiKey: true,
    isBuiltIn: false,
    baseUrl: "https://api.openai.com/v1",
    keyUrl: "https://platform.openai.com/api-keys",
    implemented: false,
    icon: "🟢",
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude 3.5 / 3.7 / Opus / Sonnet / Haiku. Requires an Anthropic API key.",
    requiresApiKey: true,
    isBuiltIn: false,
    baseUrl: "https://api.anthropic.com/v1",
    keyUrl: "https://console.anthropic.com/settings/keys",
    implemented: false,
    icon: "🟠",
  },
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 2.0 Flash, Pro, and Flash-Lite. Requires a Google AI Studio API key.",
    requiresApiKey: true,
    isBuiltIn: false,
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    keyUrl: "https://aistudio.google.com/apikey",
    implemented: false,
    icon: "🔵",
  },
  ollama: {
    id: "ollama",
    name: "Ollama (Local)",
    description: "Run open-source models locally (Llama, Qwen, Mistral). No API key — runs on localhost.",
    requiresApiKey: false,
    isBuiltIn: false,
    baseUrl: "http://localhost:11434/v1",
    implemented: false,
    icon: "🦙",
  },
  lmstudio: {
    id: "lmstudio",
    name: "LM Studio (Local)",
    description: "Run GGUF models locally via LM Studio's OpenAI-compatible server.",
    requiresApiKey: false,
    isBuiltIn: false,
    baseUrl: "http://localhost:1234/v1",
    implemented: false,
    icon: "🎛️",
  },
  "openai-compatible": {
    id: "openai-compatible",
    name: "OpenAI-Compatible",
    description: "Any endpoint that implements the OpenAI Chat Completions API (vLLM, Together, Groq, etc.).",
    requiresApiKey: true,
    isBuiltIn: false,
    implemented: false,
    icon: "🔌",
  },
  custom: {
    id: "custom",
    name: "Custom Endpoint",
    description: "Bring your own endpoint with fully custom headers, auth, and request format.",
    requiresApiKey: true,
    isBuiltIn: false,
    implemented: false,
    icon: "⚙️",
  },
};

/** Ordered list of all provider metas (for UI rendering). */
export const allProviderMetas: ProviderMeta[] = Object.values(providerMetas);
