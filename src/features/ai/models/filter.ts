/**
 * @module features/ai/models/filter
 *
 * Free/paid model filtering logic. Extracted so it can be reused by the
 * registry, the model selector UI, and the API layer independently.
 */

import type { ModelDescriptor, ModelFilter } from "./types";

/** Return only free models (input + output cost === 0). */
export function freeOnly(models: ModelDescriptor[]): ModelDescriptor[] {
  return models.filter((m) => m.isFree);
}

/** Return only paid models. */
export function paidOnly(models: ModelDescriptor[]): ModelDescriptor[] {
  return models.filter((m) => !m.isFree);
}

/** Apply the free/paid toggle. */
export function applyFreeToggle(
  models: ModelDescriptor[],
  showPaid: boolean
): ModelDescriptor[] {
  return showPaid ? models : freeOnly(models);
}

/** Apply a full ModelFilter (delegates to registry's filterModels shape). */
export function applyFilter(
  models: ModelDescriptor[],
  filter: ModelFilter
): ModelDescriptor[] {
  let out = applyFreeToggle(models, !filter.freeOnly);

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
