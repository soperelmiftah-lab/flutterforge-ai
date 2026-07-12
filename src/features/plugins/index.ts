/**
 * @module features/plugins
 *
 * Plugin System — lets first- and third-party packages extend FlutterForge:
 *  - Register new editor languages / formatters
 *  - Contribute sidebar panels, toolbar actions, command-palette entries
 *  - Hook into lifecycle events (onFileSave, onBuildComplete, …)
 *
 * Planned (Phase 4). Phase 1 ships only the host API contract.
 */

export type PluginManifest = {
  id: string;
  name: string;
  version: string;
  description?: string;
  /** Declared extension points this plugin contributes to. */
  contributes: {
    commands?: Array<{ id: string; title: string; handler: string }>;
    panels?: Array<{ id: string; title: string; slot: "sidebar" | "right" | "bottom" }>;
    languages?: Array<{ id: string; extensions: string[] }>;
  };
};

export interface PluginHost {
  register(manifest: PluginManifest): void;
  unregister(id: string): void;
  list(): PluginManifest[];
  invoke(commandId: string, ...args: unknown[]): Promise<unknown>;
}

/** The active plugin host. Plugins register against this in Phase 4. */
export const pluginHost: PluginHost = createStubHost();

function createStubHost(): PluginHost {
  const registry = new Map<string, PluginManifest>();
  return {
    register: (m) => registry.set(m.id, m),
    unregister: (id) => registry.delete(id),
    list: () => Array.from(registry.values()),
    async invoke(_cmd, ..._args) {
      throw new Error("Plugin invocation is not implemented in Phase 1. Arrives in Phase 4.");
    },
  };
}
