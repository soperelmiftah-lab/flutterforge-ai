/**
 * @module features/execution/queue
 *
 * Task Queue — manages execution requests waiting to run. Supports
 * sequential and parallel modes, priority ordering, cancel, pause,
 * resume, and retry.
 */

import type { QueueItem, QueueMode, ExecutionStatus } from "../types";
import { eventBus } from "../events";
import { uid } from "@/lib/utils";

class ExecutionQueue {
  private items: QueueItem[] = [];
  private mode: QueueMode = "sequential";
  private maxConcurrent = 1;
  private running = new Set<string>();
  private paused = false;

  setMode(mode: QueueMode, maxConcurrent = 3): void {
    this.mode = mode;
    this.maxConcurrent = mode === "parallel" ? maxConcurrent : 1;
  }

  getMode(): QueueMode {
    return this.mode;
  }

  /** Enqueue a request. Returns the queue item. */
  enqueue(requestId: string, toolId: string, priority = 0): QueueItem {
    const item: QueueItem = {
      requestId,
      toolId,
      priority,
      status: "queued",
      enqueuedAt: new Date().toISOString(),
    };
    this.items.push(item);
    // Sort by priority (desc), then by enqueue time (asc).
    this.items.sort((a, b) => b.priority - a.priority || a.enqueuedAt.localeCompare(b.enqueuedAt));
    eventBus.emit("queue:enqueued", {
      requestId,
      toolId,
      message: `Queued ${toolId} (priority ${priority})`,
    });
    return item;
  }

  /** Dequeue the next item to run (respecting mode + concurrency). */
  dequeue(): QueueItem | undefined {
    if (this.paused) return undefined;
    if (this.running.size >= this.maxConcurrent) return undefined;
    const next = this.items.find((i) => i.status === "queued");
    if (!next) return undefined;
    next.status = "running";
    next.startedAt = new Date().toISOString();
    this.running.add(next.requestId);
    return next;
  }

  /** Mark a request as finished. */
  complete(requestId: string, status: ExecutionStatus): void {
    const item = this.items.find((i) => i.requestId === requestId);
    if (item) {
      item.status = status;
      item.finishedAt = new Date().toISOString();
    }
    this.running.delete(requestId);
  }

  /** Cancel a queued or running request. */
  cancel(requestId: string): boolean {
    const item = this.items.find((i) => i.requestId === requestId);
    if (!item) return false;
    if (item.status === "queued" || item.status === "running") {
      item.status = "cancelled";
      item.finishedAt = new Date().toISOString();
      this.running.delete(requestId);
      eventBus.emit("queue:cancelled", {
        requestId,
        message: `Cancelled ${item.toolId}`,
      });
      return true;
    }
    return false;
  }

  /** Retry a failed/cancelled request by re-enqueuing it. */
  retry(requestId: string): QueueItem | undefined {
    const item = this.items.find((i) => i.requestId === requestId);
    if (!item || (item.status !== "failed" && item.status !== "cancelled")) return undefined;
    // Create a new queue entry.
    return this.enqueue(uid("req"), item.toolId, item.priority);
  }

  /** Pause the queue — no new items will be dequeued. */
  pause(): void {
    this.paused = true;
  }

  /** Resume the queue. */
  resume(): void {
    this.paused = false;
  }

  isPaused(): boolean {
    return this.paused;
  }

  /** Get all queue items. */
  getItems(): QueueItem[] {
    return [...this.items];
  }

  /** Get items by status. */
  getByStatus(status: ExecutionStatus): QueueItem[] {
    return this.items.filter((i) => i.status === status);
  }

  /** Queue stats. */
  stats(): {
    queued: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  } {
    return {
      queued: this.items.filter((i) => i.status === "queued").length,
      running: this.running.size,
      completed: this.items.filter((i) => i.status === "success").length,
      failed: this.items.filter((i) => i.status === "failed").length,
      cancelled: this.items.filter((i) => i.status === "cancelled").length,
    };
  }

  /** Clear completed/failed/cancelled items. */
  clearFinished(): void {
    this.items = this.items.filter(
      (i) => i.status === "queued" || i.status === "running" || i.status === "pending-approval"
    );
  }
}

/** Singleton execution queue. */
export const executionQueue = new ExecutionQueue();
