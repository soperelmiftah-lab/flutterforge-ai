/**
 * @module features/realtime
 *
 * Realtime transport contract (WebSocket / Socket.IO). Phase 1 defines the
 * event surface ONLY — no transport implementation.
 *
 * Architecture (planned, Phase 2+):
 *
 *   Client (browser)                        Mini-service (port 3003)
 *   ─────────────────                       ────────────────────────
 *   io("/?XTransformPort=3003")  <------>  socket.io server
 *        |                                     |
 *        +-- project:* events                  +-- namespace: /projects
 *        +-- agent:*   events                  +-- namespace: /agents
 *        +-- build:*   events                  +-- namespace: /builds
 *
 * Clients ALWAYS connect via the gateway using the relative path "/" and the
 * XTransformPort query param; never via a direct localhost URL.
 *
 * Until implemented, the frontend uses local stores for all "realtime" state.
 */

export type RealtimeNamespace = "projects" | "agents" | "builds" | "preview";

/** Canonical event names per namespace. Kept here so client & server agree. */
export const realtimeEvents = {
  projects: {
    fileChanged: "project:file_changed",
    fileSaved: "project:file_saved",
    treeUpdated: "project:tree_updated",
  },
  agents: {
    started: "agent:started",
    delta: "agent:delta",
    completed: "agent:completed",
    error: "agent:error",
    cancelled: "agent:cancelled",
  },
  builds: {
    queued: "build:queued",
    progress: "build:progress",
    log: "build:log",
    succeeded: "build:succeeded",
    failed: "build:failed",
  },
  preview: {
    reloaded: "preview:reloaded",
    error: "preview:error",
  },
} as const;

export interface RealtimeClient {
  /** Connect to a namespace (Phase 2+). */
  connect(namespace: RealtimeNamespace): Promise<void>;
  /** Subscribe to an event. Returns an unsubscribe function. */
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;
  /** Emit an event to the server. */
  emit(event: string, payload?: unknown): void;
  /** Disconnect a namespace. */
  disconnect(namespace: RealtimeNamespace): Promise<void>;
}

/**
 * The realtime client. Phase 1 returns a no-op stub so feature code can be
 * written against the contract today. Phase 2 swaps in a real socket.io client.
 */
export const realtime: RealtimeClient = {
  async connect(_ns) {
    /* no-op in Phase 1 */
  },
  on(_event, _handler) {
    return () => {};
  },
  emit(_event, _payload) {
    /* no-op in Phase 1 */
  },
  async disconnect(_ns) {
    /* no-op in Phase 1 */
  },
};
