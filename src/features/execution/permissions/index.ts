/**
 * @module features/execution/permissions
 *
 * Permission Manager — checks whether a tool's required permissions are
 * granted. Every execution request passes through here before reaching the
 * tool executor.
 *
 * Permission sets are configurable (future: per-agent, per-project). In
 * Phase 4, all permissions are granted by default except a deny-list.
 */

import type { PermissionScope, PermissionSet, RiskLevel } from "../types";

/** Default permission set — everything granted, nothing denied. */
export const defaultPermissions: PermissionSet = {
  granted: [
    "filesystem:read",
    "filesystem:write",
    "filesystem:delete",
    "terminal:execute",
    "flutter:run",
    "flutter:build",
    "git:read",
    "git:write",
    "ai:chat",
    "network:fetch",
  ],
  denied: [],
};

/** Check if a single scope is permitted. */
export function hasPermission(perms: PermissionSet, scope: PermissionScope): boolean {
  if (perms.denied.includes(scope)) return false;
  return perms.granted.includes(scope);
}

/** Check if ALL required scopes are permitted. */
export function hasAllPermissions(
  perms: PermissionSet,
  required: PermissionScope[]
): { allowed: boolean; missing: PermissionScope[] } {
  const missing = required.filter((s) => !hasPermission(perms, s));
  return { allowed: missing.length === 0, missing };
}

/** Whether a risk level requires approval. */
export function requiresApproval(riskLevel: RiskLevel): boolean {
  return riskLevel !== "safe";
}

/** Human-readable label for a permission scope. */
export const PERMISSION_LABELS: Record<PermissionScope, string> = {
  "filesystem:read": "Read Files",
  "filesystem:write": "Write Files",
  "filesystem:delete": "Delete Files",
  "terminal:execute": "Run Terminal Commands",
  "flutter:run": "Run Flutter",
  "flutter:build": "Build Flutter Apps",
  "git:read": "Read Git",
  "git:write": "Modify Git",
  "ai:chat": "AI Chat",
  "network:fetch": "Network Access",
};

/** Active permission set (mutable for future per-agent config). */
let activePermissions: PermissionSet = defaultPermissions;

export function getActivePermissions(): PermissionSet {
  return activePermissions;
}

export function setActivePermissions(perms: PermissionSet): void {
  activePermissions = perms;
}

/** Grant a scope. */
export function grant(scope: PermissionScope): void {
  if (!activePermissions.granted.includes(scope)) {
    activePermissions.granted.push(scope);
  }
  activePermissions.denied = activePermissions.denied.filter((s) => s !== scope);
}

/** Deny a scope. */
export function deny(scope: PermissionScope): void {
  if (!activePermissions.denied.includes(scope)) {
    activePermissions.denied.push(scope);
  }
  activePermissions.granted = activePermissions.granted.filter((s) => s !== scope);
}
