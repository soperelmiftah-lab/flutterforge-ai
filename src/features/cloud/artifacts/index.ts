/**
 * @module features/cloud/artifacts
 *
 * Artifacts — manages APK, AAB, ZIP, coverage, logs, reports, and
 * screenshots with retention policies.
 */

import type { Artifact, ArtifactType } from "../types";
import { uid } from "@/lib/utils";

const artifacts: Artifact[] = [];

export function createArtifact(params: { jobId: string; type: ArtifactType; name: string; path: string; sizeMb: number; signed?: boolean; retentionDays?: number }): Artifact {
  const a: Artifact = {
    id: uid("art"), jobId: params.jobId, type: params.type, name: params.name,
    path: params.path, sizeMb: params.sizeMb, createdAt: new Date().toISOString(),
    signed: params.signed ?? false,
    expiresAt: params.retentionDays ? new Date(Date.now() + params.retentionDays * 86400000).toISOString() : undefined,
  };
  artifacts.unshift(a);
  if (artifacts.length > 200) artifacts.pop();
  return a;
}

export function listArtifacts(type?: ArtifactType): Artifact[] {
  return type ? artifacts.filter((a) => a.type === type) : artifacts;
}

export function getArtifact(id: string): Artifact | undefined { return artifacts.find((a) => a.id === id); }
export function deleteArtifact(id: string): boolean { const i = artifacts.findIndex((a) => a.id === id); if (i === -1) return false; artifacts.splice(i, 1); return true; }

export function purgeExpired(): number {
  const now = Date.now();
  const expired = artifacts.filter((a) => a.expiresAt && new Date(a.expiresAt).getTime() < now);
  expired.forEach((a) => { const i = artifacts.findIndex((x) => x.id === a.id); if (i >= 0) artifacts.splice(i, 1); });
  return expired.length;
}
