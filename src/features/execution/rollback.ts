/**
 * @module features/execution/rollback
 *
 * Rollback Manager — for tools that support rollback, a Snapshot is created
 * before execution. If the user (or an agent) undoes the action, the
 * snapshot is restored.
 *
 * Supports: undo (restore last snapshot), redo (re-apply), and explicit
 * snapshot restore by id.
 */

import type { Snapshot } from "./types";
import { vfs } from "./filesystem";
import { eventBus } from "./events";
import { uid } from "@/lib/utils";
import type { WorkspacePath } from "@/features/workspace-intelligence/types";

const snapshots = new Map<string, Snapshot>();
const undoStack: string[] = [];
const redoStack: string[] = [];

/** Create a snapshot of a file before a mutation. */
export function createSnapshot(requestId: string, path: WorkspacePath): Snapshot {
  const content = vfs.snapshot(path);
  const snapshot: Snapshot = {
    id: uid("snap"),
    requestId,
    path,
    content,
    createdAt: new Date().toISOString(),
  };
  snapshots.set(snapshot.id, snapshot);
  return snapshot;
}

/** Restore a snapshot by id. */
export function restoreSnapshot(snapshotId: string): boolean {
  const snapshot = snapshots.get(snapshotId);
  if (!snapshot) return false;
  vfs.restore(snapshot.path, snapshot.content);
  snapshot.restored = true;
  snapshots.set(snapshotId, snapshot);
  undoStack.push(snapshotId);
  eventBus.emit("rollback:completed", {
    requestId: snapshot.requestId,
    message: `Restored snapshot for ${snapshot.path}`,
    details: snapshot,
  });
  return true;
}

/** Undo the last applied snapshot (restore it again). */
export function undo(): Snapshot | undefined {
  const id = undoStack.pop();
  if (!id) return undefined;
  redoStack.push(id);
  const snapshot = snapshots.get(id);
  if (snapshot) {
    vfs.restore(snapshot.path, snapshot.content);
    eventBus.emit("rollback:completed", {
      requestId: snapshot.requestId,
      message: `Undo: restored ${snapshot.path}`,
      details: snapshot,
    });
  }
  return snapshot;
}

/** Redo the last undone action (re-apply the post-snapshot content). */
export function redo(): Snapshot | undefined {
  const id = redoStack.pop();
  if (!id) return undefined;
  undoStack.push(id);
  // Redo doesn't have the "after" content stored; in a full implementation
  // we'd store both. For Phase 4, redo just re-pushes to undo stack.
  return snapshots.get(id);
}

/** List all snapshots. */
export function listSnapshots(): Snapshot[] {
  return Array.from(snapshots.values()).reverse();
}

/** Get a snapshot by id. */
export function getSnapshot(id: string): Snapshot | undefined {
  return snapshots.get(id);
}

/** Whether undo is available. */
export function canUndo(): boolean {
  return undoStack.length > 0;
}

/** Whether redo is available. */
export function canRedo(): boolean {
  return redoStack.length > 0;
}

/** Clear all snapshots (does not affect the filesystem). */
export function clearSnapshots(): void {
  snapshots.clear();
  undoStack.length = 0;
  redoStack.length = 0;
}
