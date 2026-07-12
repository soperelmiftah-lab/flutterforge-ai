/**
 * @module features/workspace-intelligence/watcher
 *
 * File Watcher contract — detects create/delete/rename/modify/move events
 * in the workspace and re-indexes affected files. Phase 3 ships the contract
 * + an in-memory stub; a real fs.watch implementation arrives with the
 * Flutter Engine phase.
 */

import type { FileChangeEvent, WorkspacePath } from "@/features/workspace-intelligence/types";

/** The file watcher contract. */
export interface FileWatcher {
  /** Start watching the workspace. */
  start(): Promise<void>;
  /** Stop watching. */
  stop(): Promise<void>;
  /** Subscribe to change events. Returns an unsubscribe function. */
  on(handler: (event: FileChangeEvent) => void): () => void;
  /** Whether the watcher is currently active. */
  readonly active: boolean;
}

/** A simple in-memory watcher that can be fed events programmatically. */
export class InMemoryFileWatcher implements FileWatcher {
  private handlers = new Set<(event: FileChangeEvent) => void>();
  private _active = false;

  get active(): boolean {
    return this._active;
  }

  async start(): Promise<void> {
    this._active = true;
  }

  async stop(): Promise<void> {
    this._active = false;
  }

  on(handler: (event: FileChangeEvent) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Emit an event to all subscribers (used by tests / programmatic triggers). */
  emit(event: FileChangeEvent): void {
    for (const handler of this.handlers) handler(event);
  }

  /** Convenience emitters. */
  emitCreate(path: WorkspacePath): void {
    this.emit({ type: "create", path, timestamp: new Date().toISOString() });
  }
  emitDelete(path: WorkspacePath): void {
    this.emit({ type: "delete", path, timestamp: new Date().toISOString() });
  }
  emitModify(path: WorkspacePath): void {
    this.emit({ type: "modify", path, timestamp: new Date().toISOString() });
  }
  emitRename(oldPath: WorkspacePath, newPath: WorkspacePath): void {
    this.emit({ type: "rename", path: newPath, oldPath, timestamp: new Date().toISOString() });
  }
  emitMove(oldPath: WorkspacePath, newPath: WorkspacePath): void {
    this.emit({ type: "move", path: newPath, oldPath, timestamp: new Date().toISOString() });
  }
}

/** Singleton watcher instance. */
export const watcher = new InMemoryFileWatcher();
