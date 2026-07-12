/**
 * @module features/preview
 *
 * Preview Engine — renders a live, hot-reloadable preview of the Flutter
 * project. Planned (Phase 3):
 *  - Web preview via Flutter web engine (hot reload on save)
 *  - Android device preview via device bridge
 *  - Form-factor switching (phone / tablet / desktop)
 *  - Screenshot & deep-link support
 *
 * Phase 1: contract only. The workspace reserves the right panel for this.
 */

export type PreviewTarget = "web" | "android" | "ios";
export type DeviceProfile = "mobile" | "tablet" | "desktop";

export interface PreviewSession {
  id: string;
  projectId: string;
  target: PreviewTarget;
  device: DeviceProfile;
  status: "idle" | "building" | "ready" | "error";
  url?: string;
  lastReloadedAt?: string;
}

/** Start a preview session. NOT IMPLEMENTED in Phase 1. */
export async function startPreview(
  _projectId: string,
  _target: PreviewTarget,
  _device: DeviceProfile
): Promise<PreviewSession> {
  throw new Error("Preview engine is not implemented in Phase 1. Arrives in Phase 3.");
}

/** Trigger a hot reload. NOT IMPLEMENTED in Phase 1. */
export async function hotReload(_sessionId: string): Promise<void> {
  throw new Error("Hot reload is not implemented in Phase 1. Arrives in Phase 3.");
}

/** Stop a preview session. NOT IMPLEMENTED in Phase 1. */
export async function stopPreview(_sessionId: string): Promise<void> {
  throw new Error("Preview engine is not implemented in Phase 1. Arrives in Phase 3.");
}
