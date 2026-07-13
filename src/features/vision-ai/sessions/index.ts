/**
 * @module features/vision-ai/sessions
 *
 * Session Manager — persists analysis history, reports, screens, comparisons,
 * and recommendations.
 */

import type { VisionSession } from "../types";
import { uid } from "@/lib/utils";

const sessions: VisionSession[] = [];

export function createSession(deviceId: string): VisionSession {
  const session: VisionSession = { id: uid("vsession"), deviceId, status: "analyzing", createdAt: new Date().toISOString() };
  sessions.push(session);
  return session;
}

export function completeSession(id: string, reportId: string): void {
  const s = sessions.find((x) => x.id === id);
  if (s) { s.status = "completed"; s.reportId = reportId; }
}

export function failSession(id: string): void {
  const s = sessions.find((x) => x.id === id);
  if (s) s.status = "failed";
}

export function getSessions(): VisionSession[] {
  return [...sessions].reverse();
}
