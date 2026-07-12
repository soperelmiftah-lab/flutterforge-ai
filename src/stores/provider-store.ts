"use client";

import { create } from "zustand";
import type { ProviderId, ProviderMeta, HealthStatus, CredentialView } from "@/features/ai/provider/types";
import { allProviderMetas } from "@/features/ai/provider/metas";
import { api } from "@/lib/api";

/**
 * Provider store — manages provider metadata, credential views (masked),
 * and health status. Fetches from the API on hydration. Does NOT hold raw
 * API keys — those live encrypted on the server.
 */
interface ProviderStoreState {
  providers: ProviderMeta[];
  credentials: Record<string, CredentialView>;
  health: Record<string, HealthStatus>;
  loading: boolean;
  hydrate: () => Promise<void>;
  refreshHealth: (provider: ProviderId) => Promise<void>;
  refreshAllHealth: () => Promise<void>;
  saveApiKey: (provider: ProviderId, key: string) => Promise<void>;
  deleteApiKey: (provider: ProviderId) => Promise<void>;
  getProvider: (id: ProviderId) => ProviderMeta | undefined;
}

export const useProviderStore = create<ProviderStoreState>((set, get) => ({
  providers: allProviderMetas,
  credentials: {},
  health: {},
  loading: false,

  hydrate: async () => {
    set({ loading: true });
    try {
      const response = await api.get<{ data: Array<{ id: string; credential?: CredentialView }> }>("/ai/providers");
      const credMap: Record<string, CredentialView> = {};
      for (const item of response.data ?? []) {
        if (item.credential) {
          credMap[item.id] = item.credential;
        }
      }
      set({ credentials: credMap, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  refreshHealth: async (provider) => {
    try {
      const status = await api.get<HealthStatus>(`/ai/health?provider=${provider}`);
      set((s) => ({ health: { ...s.health, [provider]: status } }));
    } catch {
      /* ignore */
    }
  },

  refreshAllHealth: async () => {
    const { providers } = get();
    await Promise.allSettled(providers.map((p) => get().refreshHealth(p.id)));
  },

  saveApiKey: async (provider, key) => {
    await api.post("/ai/providers", { provider, apiKey: key });
    await get().hydrate();
  },

  deleteApiKey: async (provider) => {
    await api.delete(`/ai/providers?provider=${provider}`);
    await get().hydrate();
  },

  getProvider: (id) => get().providers.find((p) => p.id === id),
}));
