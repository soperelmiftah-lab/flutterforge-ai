"use client";

import * as React from "react";
import { useProviderStore } from "@/stores/provider-store";
import { useModelStore } from "@/stores/model-store";

/**
 * useAIHydration — ensures the provider and model stores are loaded.
 * Call once at the top of any page that uses AI features.
 */
export function useAIHydration() {
  const hydrateProviders = useProviderStore((s) => s.hydrate);
  const hydrateModels = useModelStore((s) => s.hydrate);
  const providersLoaded = useProviderStore((s) => Object.keys(s.credentials).length > 0);
  const modelsLoaded = useModelStore((s) => s.models.length > 0);

  React.useEffect(() => {
    if (!providersLoaded) hydrateProviders();
    if (!modelsLoaded) hydrateModels();
  }, [providersLoaded, modelsLoaded, hydrateProviders, hydrateModels]);
}
