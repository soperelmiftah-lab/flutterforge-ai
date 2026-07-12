/**
 * @module features/ai/provider/registry
 *
 * The provider registry. Maps ProviderId → provider instance, so any caller
 * can resolve a provider by id without knowing its concrete class. Singleton
 * instances are reused across requests.
 */

import type { AIProvider, ProviderId, ProviderMeta, ProviderConfig } from "./types";
import { providerMetas, allProviderMetas } from "./metas";
import { OpenRouterProvider } from "./openrouter";
import { ForgeProvider } from "./forge";
import {
  OpenAIProvider,
  AnthropicProvider,
  GeminiProvider,
  OllamaProvider,
  LMStudioProvider,
  OpenAICompatibleProvider,
  CustomProvider,
} from "./placeholders";

// Re-export metadata (defined in metas.ts to keep client-safe imports separate).
export { providerMetas, allProviderMetas };

/** Singleton provider instances. */
const instances = new Map<ProviderId, AIProvider>();

/** Factory map — creates a fresh instance for each provider id. */
const factories: Record<ProviderId, () => AIProvider> = {
  forge: () => new ForgeProvider(),
  openrouter: () => new OpenRouterProvider(),
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  gemini: () => new GeminiProvider(),
  ollama: () => new OllamaProvider(),
  lmstudio: () => new LMStudioProvider(),
  "openai-compatible": () => new OpenAICompatibleProvider(),
  custom: () => new CustomProvider(),
};

/** Get (or create) the singleton provider instance for an id. */
export function getProvider(id: ProviderId): AIProvider {
  let instance = instances.get(id);
  if (!instance) {
    instance = factories[id]();
    instances.set(id, instance);
  }
  return instance;
}

/** Initialize a provider with credentials/config. */
export async function initProvider(id: ProviderId, config: ProviderConfig): Promise<void> {
  const provider = getProvider(id);
  await provider.initialize(config);
}

/** Get metadata for a provider. */
export function getProviderMeta(id: ProviderId): ProviderMeta {
  return providerMetas[id];
}

/** List all provider ids. */
export function listProviderIds(): ProviderId[] {
  return Object.keys(factories) as ProviderId[];
}
