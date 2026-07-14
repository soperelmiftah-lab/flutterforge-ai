/**
 * @module features/autonomous/sessions
 *
 * Session Manager — persists autonomous engineering sessions.
 */

import type { AutonomousSession } from "../types";
import { uid } from "@/lib/utils";

const sessions: AutonomousSession[] = [];

export function createSession(problemId: string, pipelineId: string): AutonomousSession {
  const session: AutonomousSession = { id: uid("asession"), problemId, pipelineId, status: "active", createdAt: new Date().toISOString() };
  sessions.push(session);
  return session;
}

export function completeSession(id: string): void {
  const s = sessions.find((x) => x.id === id);
  if (s) { s.status = "completed"; s.completedAt = new Date().toISOString(); }
}

export function failSession(id: string): void {
  const s = sessions.find((x) => x.id === id);
  if (s) s.status = "failed";
}

export function rollbackSession(id: string): void {
  const s = sessions.find((x) => x.id === id);
  if (s) s.status = "rolled-back";
}

export function getSessions(): AutonomousSession[] {
  return [...sessions].reverse();
}
