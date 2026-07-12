/**
 * @module features/execution/events
 *
 * Event Bus — the central pub/sub for execution events. Every stage of the
 * execution pipeline emits events: tool:started, patch:generated,
 * approval:requested, rollback:completed, etc.
 *
 * The UI (Execution Center, Approval Queue, History) subscribes to these
 * events to update in real time. The Logger and Telemetry also subscribe
 * to record everything.
 */

import type { ExecutionEvent, ExecutionEventType } from "../types";
import { uid } from "@/lib/utils";

type EventHandler = (event: ExecutionEvent) => void;

class EventBus {
  private handlers = new Map<ExecutionEventType | "*", Set<EventHandler>>();
  private history: ExecutionEvent[] = [];
  private readonly maxHistory = 500;

  /** Subscribe to a specific event type, or "*" for all. Returns unsubscribe. */
  on(type: ExecutionEventType | "*", handler: EventHandler): () => void {
    if (!this.handlers.has(type)) this.handlers.set(type, new Set());
    this.handlers.get(type)!.add(handler);
    return () => this.handlers.get(type)?.delete(handler);
  }

  /** Emit an event to all matching subscribers. */
  emit(type: ExecutionEventType, payload: Omit<ExecutionEvent, "id" | "type" | "timestamp">): void {
    const event: ExecutionEvent = {
      id: uid("evt"),
      type,
      timestamp: new Date().toISOString(),
      ...payload,
    };
    this.history.push(event);
    if (this.history.length > this.maxHistory) this.history.shift();
    // Notify specific subscribers + wildcard subscribers.
    this.handlers.get(type)?.forEach((h) => h(event));
    this.handlers.get("*")?.forEach((h) => h(event));
  }

  /** Get recent events (optionally filtered by type). */
  getHistory(type?: ExecutionEventType, limit = 50): ExecutionEvent[] {
    const filtered = type ? this.history.filter((e) => e.type === type) : this.history;
    return filtered.slice(-limit).reverse();
  }

  /** Clear event history. */
  clear(): void {
    this.history = [];
  }
}

/** Singleton event bus instance. */
export const eventBus = new EventBus();
