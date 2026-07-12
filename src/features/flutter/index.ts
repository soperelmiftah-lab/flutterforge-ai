/**
 * @module features/flutter
 *
 * Flutter Engine — manages the Flutter SDK, builds, and artifact generation.
 * Planned (Phase 3):
 *  - Provisioned Flutter SDK (pinned versions)
 *  - `flutter pub get` / `flutter analyze` / `flutter build` execution
 *  - APK & appbundle generation
 *  - Build caching & queueing
 *
 * Phase 1: contract only.
 */

export type BuildTarget = "apk" | "appbundle" | "web" | "ios";
export type BuildStatus = "queued" | "running" | "success" | "failed";

export interface BuildJob {
  id: string;
  projectId: string;
  target: BuildTarget;
  status: BuildStatus;
  startedAt?: string;
  finishedAt?: string;
  artifactUrl?: string;
  logs: string[];
}

export interface FlutterVersion {
  version: string;
  channel: "stable" | "beta" | "main";
}

/** Queue a build. NOT IMPLEMENTED in Phase 1. */
export async function queueBuild(
  _projectId: string,
  _target: BuildTarget
): Promise<BuildJob> {
  throw new Error("Flutter build engine is not implemented in Phase 1. Arrives in Phase 3.");
}

/** Get build status. NOT IMPLEMENTED in Phase 1. */
export async function getBuildStatus(_jobId: string): Promise<BuildJob> {
  throw new Error("Flutter build engine is not implemented in Phase 1. Arrives in Phase 3.");
}

/** List installed Flutter SDK versions. Empty in Phase 1. */
export const flutterVersions: FlutterVersion[] = [];
