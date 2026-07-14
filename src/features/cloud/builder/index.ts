/**
 * @module features/cloud/builder
 *
 * Build Farm — manages queued and parallel builds for APK, AAB, Web,
 * Windows, Linux, macOS.
 */

import type { BuildFarmJob, BuildTarget, BuildMode } from "../types";
import { enqueueJob } from "../scheduler";
import { createArtifact } from "../artifacts";
import { uid } from "@/lib/utils";

const builds: BuildFarmJob[] = [];

export function queueBuild(params: { target: BuildTarget; mode: BuildMode; flavor?: string; parallel?: boolean; priority?: number; projectId?: string }): BuildFarmJob {
  const job = enqueueJob({
    type: "build",
    command: "flutter",
    args: ["build", params.target, `--${params.mode}`, params.flavor ? `--flavor=${params.flavor}` : ""].filter(Boolean),
    priority: params.priority ?? 5,
    runtimeType: "local",
    projectId: params.projectId,
  });

  const build: BuildFarmJob = {
    id: uid("build"), target: params.target, mode: params.mode, flavor: params.flavor,
    status: "queued", priority: params.priority ?? 5, enqueuedAt: new Date().toISOString(),
    parallel: params.parallel ?? true,
  };
  builds.unshift(build);
  return build;
}

export function listBuilds(limit = 20): BuildFarmJob[] { return builds.slice(0, limit); }
export function getBuild(id: string): BuildFarmJob | undefined { return builds.find((b) => b.id === id); }
export function getActiveBuilds(): BuildFarmJob[] { return builds.filter((b) => b.status === "running" || b.status === "queued"); }

export function getSupportedTargets(): Array<{ target: BuildTarget; modes: BuildMode[]; available: boolean }> {
  return [
    { target: "apk", modes: ["debug", "profile", "release"], available: true },
    { target: "aab", modes: ["debug", "profile", "release"], available: true },
    { target: "web", modes: ["debug", "profile", "release"], available: true },
    { target: "windows", modes: ["debug", "profile", "release"], available: false },
    { target: "linux", modes: ["debug", "profile", "release"], available: true },
    { target: "macos", modes: ["debug", "profile", "release"], available: false },
  ];
}
