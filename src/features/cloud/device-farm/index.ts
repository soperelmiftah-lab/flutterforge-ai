/**
 * @module features/cloud/device-farm
 *
 * Device Farm — manages Android emulators, physical devices, Chrome,
 * desktop, and iOS simulators with reservation.
 */

import type { FarmDevice } from "../types";

const devices: FarmDevice[] = [
  { id: "emulator-5554", name: "Pixel 7 API 34", type: "android-emulator", status: "available", capabilities: ["hot-reload", "screenshot", "logcat"] },
  { id: "emulator-5556", name: "Pixel 5 API 31", type: "android-emulator", status: "available", capabilities: ["hot-reload", "screenshot"] },
  { id: "chrome-1", name: "Chrome (desktop)", type: "chrome", status: "available", capabilities: ["hot-reload", "web-renderer"] },
  { id: "desktop-1", name: "Linux Desktop", type: "desktop", status: "available", capabilities: ["hot-reload"] },
  { id: "physical-pixel7", name: "Pixel 7 Pro (USB)", type: "android-physical", status: "offline", capabilities: ["hot-reload", "screenshot", "logcat"] },
];

export function listDevices(): FarmDevice[] { return [...devices]; }
export function getAvailableDevices(): FarmDevice[] { return devices.filter((d) => d.status === "available"); }
export function getDevice(id: string): FarmDevice | undefined { return devices.find((d) => d.id === id); }

export function reserveDevice(id: string, reservedBy: string): boolean {
  const d = devices.find((x) => x.id === id);
  if (!d || d.status !== "available") return false;
  d.status = "reserved"; d.reservedBy = reservedBy; d.reservedAt = new Date().toISOString();
  return true;
}

export function releaseDevice(id: string): boolean {
  const d = devices.find((x) => x.id === id);
  if (!d) return false;
  d.status = "available"; d.reservedBy = undefined; d.reservedAt = undefined;
  return true;
}
