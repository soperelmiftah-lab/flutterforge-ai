/**
 * @module features/execution/logger
 *
 * Structured Logger — records every execution event in a searchable,
 * filterable, exportable log. Subscribes to the event bus for automatic
 * capture.
 */

import type { ExecutionEvent, ExecutionEventType } from "../types";
import { eventBus } from "../events";

export interface LogEntry {
  id: string;
  level: "info" | "warn" | "error";
  type: ExecutionEventType;
  message: string;
  timestamp: string;
  requestId?: string;
  toolId?: string;
  details?: unknown;
}

class ExecutionLogger {
  private entries: LogEntry[] = [];
  private readonly maxEntries = 1000;
  private initialized = false;

  /** Start listening to the event bus. Called once by the engine. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;
    eventBus.on("*", (event) => this.record(event));
  }

  /** Record an event as a log entry. */
  private record(event: ExecutionEvent): void {
    const level: LogEntry["level"] =
      event.type.includes("failed") || event.type.includes("rejected")
        ? "error"
        : event.type.includes("warning")
          ? "warn"
          : "info";
    this.entries.push({
      id: event.id,
      level,
      type: event.type,
      message: event.message,
      timestamp: event.timestamp,
      requestId: event.requestId,
      toolId: event.toolId,
      details: event.details,
    });
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }

  /** Manual log entry (for non-event messages). */
  log(level: LogEntry["level"], message: string, details?: unknown): void {
    this.entries.push({
      id: `log_${Math.random().toString(36).slice(2, 10)}`,
      level,
      type: "tool:finished",
      message,
      timestamp: new Date().toISOString(),
      details,
    });
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }

  /** Get all entries, optionally filtered. */
  getEntries(filter?: {
    level?: LogEntry["level"];
    type?: ExecutionEventType;
    query?: string;
    limit?: number;
  }): LogEntry[] {
    let out = [...this.entries].reverse();
    if (filter?.level) out = out.filter((e) => e.level === filter.level);
    if (filter?.type) out = out.filter((e) => e.type === filter.type);
    if (filter?.query) {
      const q = filter.query.toLowerCase();
      out = out.filter(
        (e) => e.message.toLowerCase().includes(q) || e.toolId?.toLowerCase().includes(q)
      );
    }
    return out.slice(0, filter?.limit ?? 100);
  }

  /** Export logs as JSON. */
  export(): string {
    return JSON.stringify(this.entries, null, 2);
  }

  /** Clear all logs. */
  clear(): void {
    this.entries = [];
  }
}

/** Singleton logger. */
export const logger = new ExecutionLogger();
