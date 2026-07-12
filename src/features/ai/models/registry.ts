/**
 * @module features/ai/models/registry
 *
 * Dynamic model registry. Aggregates models from all configured providers,
 * caches them, and provides filtering (free/paid, capability, search) and
 * sorting. The model selector UI and the chat engine both read from here.
 */

import type { ModelDescriptor, ModelFilter, ModelSortKey } from "./types";
import type { ProviderId } from "@/features/ai/provider/types";
import { getProvider } from "@/features/ai/provider/registry";

/** Cache TTL for model lists (5 minutes). */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface CacheEntry {
  models: ModelDescriptor[];
  fetchedAt: number;
}

/** Per-provider model cache. */
const cache = new Map<ProviderId, CacheEntry>();

/** Clear the cache for a provider (or all providers). */
export function invalidateCache(provider?: ProviderId): void {
  if (provider) {
    cache.delete(provider);
  } else {
    cache.clear();
  }
}

/** Fetch models from a single provider (with caching). */
export async function fetchProviderModels(
  providerId: ProviderId
): Promise<ModelDescriptor[]> {
  const cached = cache.get(providerId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.models;
  }

  const provider = getProvider(providerId);
  try {
    const models = await provider.models();
    cache.set(providerId, { models, fetchedAt: Date.now() });
    return models;
  } catch {
    // If a provider fails, return cached data (even if stale) or empty.
    return cached?.models ?? [];
  }
}

/** Fetch models from all implemented providers and merge. */
export async function fetchAllModels(): Promise<ModelDescriptor[]> {
  const providerIds: ProviderId[] = [
    "forge",
    "openrouter",
    "openai",
    "anthropic",
    "gemini",
    "ollama",
    "lmstudio",
    "openai-compatible",
    "custom",
  ];
  const results = await Promise.allSettled(providerIds.map(fetchProviderModels));
  return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
}

/** Apply a filter to a list of models. */
export function filterModels(models: ModelDescriptor[], filter: ModelFilter): ModelDescriptor[] {
  let out = models;

  if (filter.freeOnly) {
    out = out.filter((m) => m.isFree);
  }
  if (filter.provider) {
    out = out.filter((m) => m.provider === filter.provider);
  }
  if (filter.requires) {
    for (const [key, val] of Object.entries(filter.requires)) {
      if (val) {
        out = out.filter((m) => m.capabilities[key as keyof typeof m.capabilities]);
      }
    }
  }
  if (filter.query?.trim()) {
    const q = filter.query.toLowerCase();
    out = out.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }
  return out;
}

/** Sort models by the given key. */
export function sortModels(models: ModelDescriptor[], key: ModelSortKey): ModelDescriptor[] {
  const arr = [...models];
  switch (key) {
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name));
    case "contextLength":
      return arr.sort((a, b) => b.contextLength - a.contextLength);
    case "cost":
      return arr.sort((a, b) => a.inputCostPer1M + a.outputCostPer1M - (b.inputCostPer1M + b.outputCostPer1M));
    case "popularity":
    default:
      // Free models first, then by context length desc.
      return arr.sort((a, b) => {
        if (a.isFree !== b.isFree) return a.isFree ? -1 : 1;
        return b.contextLength - a.contextLength;
      });
  }
}

/** Find a single model by id across all providers. */
export async function findModel(modelId: string): Promise<ModelDescriptor | undefined> {
  const all = await fetchAllModels();
  return all.find((m) => m.id === modelId);
}

/** Get only free models from all providers. */
export async function fetchFreeModels(): Promise<ModelDescriptor[]> {
  const all = await fetchAllModels();
  return all.filter((m) => m.isFree);
}
