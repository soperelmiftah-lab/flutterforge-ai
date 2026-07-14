/**
 * @module features/visual-runtime/screenshots
 *
 * Screenshot Engine — captures screenshots with metadata, history, and
 * device/orientation information.
 */

import type { Screenshot } from "../types";
import { uid } from "@/lib/utils";

const screenshots: Screenshot[] = [];
const MAX_SCREENSHOTS = 100;

/** Capture a screenshot (mock — would run `adb shell screencap`). */
export function captureScreenshot(deviceId: string, device?: { resolution?: string; orientation?: string }): Screenshot {
  const [w, h] = (device?.resolution ?? "1080x2400").split("x").map(Number);
  const isPortrait = device?.orientation !== "landscape";
  const screenshot: Screenshot = {
    id: uid("shot"),
    deviceId,
    dataUrl: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="${isPortrait ? w : h}" height="${isPortrait ? h : w}"><rect width="100%" height="100%" fill="#1a1a2e"/><text x="50%" y="50%" fill="#e6edf3" font-family="monospace" font-size="14" text-anchor="middle">Flutter App Preview</text><rect x="20" y="40" width="${isPortrait ? w - 40 : h - 40}" height="60" rx="8" fill="#16213e"/><text x="50%" y="75" fill="#34d399" font-family="monospace" font-size="11" text-anchor="middle">Home Screen</text></svg>`)}`,
    width: isPortrait ? w : h,
    height: isPortrait ? h : w,
    orientation: (device?.orientation ?? "portrait") as "portrait" | "landscape",
    timestamp: new Date().toISOString(),
    appPackage: "com.example.forge_demo",
  };
  screenshots.unshift(screenshot);
  if (screenshots.length > MAX_SCREENSHOTS) screenshots.pop();
  return screenshot;
}

/** Get all screenshots. */
export function getScreenshots(deviceId?: string): Screenshot[] {
  return deviceId ? screenshots.filter((s) => s.deviceId === deviceId) : screenshots;
}

/** Get a screenshot by id. */
export function getScreenshot(id: string): Screenshot | undefined {
  return screenshots.find((s) => s.id === id);
}

/** Delete a screenshot. */
export function deleteScreenshot(id: string): boolean {
  const idx = screenshots.findIndex((s) => s.id === id);
  if (idx === -1) return false;
  screenshots.splice(idx, 1);
  return true;
}

/** Clear all screenshots. */
export function clearScreenshots(): void {
  screenshots.length = 0;
}
