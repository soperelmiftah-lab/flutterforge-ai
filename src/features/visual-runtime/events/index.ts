/**
 * @module features/visual-runtime/events
 *
 * Events — captures tap, long-press, scroll, navigation, keyboard, and
 * lifecycle events from the running app.
 */

import type { VisualEvent, EventType } from "../types";
import { uid } from "@/lib/utils";

const events: VisualEvent[] = [];
const MAX = 300;

/** Record a visual event. */
export function recordEvent(type: EventType, details: Record<string, unknown>): VisualEvent {
  const event: VisualEvent = { id: uid("evt"), type, timestamp: new Date().toISOString(), details };
  events.unshift(event);
  if (events.length > MAX) events.pop();
  return event;
}

/** Get events, optionally filtered by type. */
export function getEvents(type?: EventType, limit = 50): VisualEvent[] {
  const filtered = type ? events.filter((e) => e.type === type) : events;
  return filtered.slice(0, limit);
}

/** Clear all events. */
export function clearEvents(): void {
  events.length = 0;
}

/** Seed mock events. */
export function seedMockEvents(): void {
  recordEvent("tap", { x: 180, y: 400, widget: "ElevatedButton" });
  recordEvent("navigation", { from: "/", to: "/details" });
  recordEvent("scroll", { dx: 0, dy: -120 });
  recordEvent("lifecycle", { state: "resumed" });
}

seedMockEvents();
