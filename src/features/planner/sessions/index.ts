/**
 * @module features/planner/sessions
 *
 * Session Manager — each planning conversation has its own session that
 * persists the goal, plan, timeline, and thinking steps.
 */

import type { PlanningSession, Intent, Goal, Plan, Evaluation, ThinkingStep } from "../types";
import { getTimeline } from "../timeline";
import { uid } from "@/lib/utils";

const sessions = new Map<string, PlanningSession>();

/** Create a new planning session. */
export function createSession(intent: Intent, goal: Goal, thinkingSteps: ThinkingStep[]): PlanningSession {
  const now = new Date().toISOString();
  const session: PlanningSession = {
    id: uid("session"),
    title: goal.title,
    intent,
    goal,
    timeline: [],
    thinkingSteps,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  sessions.set(session.id, session);
  return session;
}

/** Get a session by id. */
export function getSession(id: string): PlanningSession | undefined {
  return sessions.get(id);
}

/** Update a session's plan. */
export function setSessionPlan(sessionId: string, plan: Plan): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.plan = plan;
    session.updatedAt = new Date().toISOString();
  }
}

/** Update a session's evaluation. */
export function setSessionEvaluation(sessionId: string, evaluation: Evaluation): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.evaluation = evaluation;
    session.status = "completed";
    session.updatedAt = new Date().toISOString();
  }
}

/** Refresh a session's timeline from the global timeline. */
export function refreshSessionTimeline(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.timeline = getTimeline(100);
    session.updatedAt = new Date().toISOString();
  }
}

/** Update a session's thinking steps. */
export function updateThinkingSteps(sessionId: string, steps: ThinkingStep[]): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.thinkingSteps = steps;
    session.updatedAt = new Date().toISOString();
  }
}

/** List all sessions. */
export function listSessions(): PlanningSession[] {
  return Array.from(sessions.values()).reverse();
}

/** Get active sessions. */
export function getActiveSessions(): PlanningSession[] {
  return Array.from(sessions.values()).filter((s) => s.status === "active");
}

/** Archive a session. */
export function archiveSession(id: string): void {
  const session = sessions.get(id);
  if (session) {
    session.status = "archived";
    session.updatedAt = new Date().toISOString();
  }
}

/** Delete a session. */
export function deleteSession(id: string): void {
  sessions.delete(id);
}
