/**
 * @module features/visual-runtime/preview
 *
 * Preview Manager — manages device previews for Android, Chrome, and
 * desktop with zoom, rotation, and orientation support.
 */

import type { PreviewConfig, PreviewTarget } from "../types";

const defaultConfig: PreviewConfig = {
  target: "android",
  deviceId: "emulator-5554",
  zoom: 1,
  orientation: "portrait",
  width: 360,
  height: 800,
};

let activeConfig: PreviewConfig = { ...defaultConfig };

/** Get the active preview config. */
export function getPreviewConfig(): PreviewConfig {
  return activeConfig;
}

/** Set the preview target. */
export function setTarget(target: PreviewTarget): void {
  activeConfig.target = target;
  const sizes: Record<PreviewTarget, { width: number; height: number }> = {
    android: { width: 360, height: 800 },
    chrome: { width: 1280, height: 800 },
    desktop: { width: 1024, height: 768 },
  };
  activeConfig.width = sizes[target].width;
  activeConfig.height = sizes[target].height;
}

/** Set zoom level. */
export function setZoom(zoom: number): void {
  activeConfig.zoom = Math.max(0.25, Math.min(3, zoom));
}

/** Toggle orientation. */
export function toggleOrientation(): void {
  activeConfig.orientation = activeConfig.orientation === "portrait" ? "landscape" : "portrait";
  const w = activeConfig.width;
  activeConfig.width = activeConfig.height;
  activeConfig.height = w;
}

/** Reset to defaults. */
export function resetPreview(): void {
  activeConfig = { ...defaultConfig };
}

/** Get available preview targets. */
export function getPreviewTargets(): Array<{ target: PreviewTarget; label: string }> {
  return [
    { target: "android", label: "Android" },
    { target: "chrome", label: "Chrome" },
    { target: "desktop", label: "Desktop" },
  ];
}
