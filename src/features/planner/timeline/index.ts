/**
 * @module features/planner/timeline
 *
 * Timeline — records every planner/orchestrator event in chronological order.
 * Powers the Timeline Viewer UI.
 */

import type { TimelineEvent, TimelineEventType } from "../types";
import { uid } from "@/lib/utils";

const events: TimelineEvent[] = [];
const MAX_EVENTS = 1000;

/** Emit a timeline event. */
export function emitTimeline(
  type: TimelineEventType,
  title: string,
  taskId?: string,
  agentId?: string,
  description?: string,
  metadata?: unknown
): TimelineEvent {
  const event: TimelineEvent = {
    id: uid("tl"),
    type,
    title,
    description,
    timestamp: new Date().toISOString(),
    taskId,
    agentId,
    metadata,
  };
  events.push(event);
  if (events.length > MAX_EVENTS) events.shift();
  return event;
}

/** Get recent events. */
export function getTimeline(limit = 50, type?: TimelineEventType): TimelineEvent[] {
  const filtered = type ? events.filter((e) => e.type === type) : events;
  return [...filtered].reverse().slice(0, limit);
}

/** Clear the timeline. */
export function clearTimeline(): void {
  events.length = 0;
}

/** Get timeline event counts by type. */
export function timelineStats(): Record<TimelineEventType, number> {
  const stats = {} as Record<TimelineEventType, number>;
  for (const event of events) {
    stats[event.type] = (stats[event.type] ?? 0) + 1;
  }
  return stats;
}
