/**
 * @module features/visual-runtime/sessions
 *
 * Session Manager — persists connected devices, screenshots, streams,
 * logs, and events per visual session.
 */

import type { VisualSession } from "../types";
import { uid } from "@/lib/utils";

const sessions: VisualSession[] = [];

/** Create a new visual session. */
export function createSession(deviceId: string): VisualSession {
  const session: VisualSession = {
    id: uid("vsession"),
    deviceId,
    connectedAt: new Date().toISOString(),
    screenshotCount: 0,
    streamDurationMs: 0,
    logCount: 0,
    eventCount: 0,
    isActive: true,
  };
  sessions.push(session);
  return session;
}

/** End a session. */
export function endSession(id: string): void {
  const session = sessions.find((s) => s.id === id);
  if (session) {
    session.isActive = false;
    session.disconnectedAt = new Date().toISOString();
  }
}

/** Get all sessions. */
export function getSessions(): VisualSession[] {
  return [...sessions].reverse();
}

/** Get active sessions. */
export function getActiveSessions(): VisualSession[] {
  return sessions.filter((s) => s.isActive);
}

/** Update session counts. */
export function updateSessionCounts(id: string, updates: Partial<Pick<VisualSession, "screenshotCount" | "logCount" | "eventCount" | "streamDurationMs">>): void {
  const session = sessions.find((s) => s.id === id);
  if (session) Object.assign(session, updates);
}
