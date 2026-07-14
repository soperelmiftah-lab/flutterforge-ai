/**
 * @module features/visual-runtime/device-bridge
 *
 * Device Bridge — the high-level bridge coordinator that ties together ADB
 * discovery, connection management, and visual session lifecycle.
 */

import type { BridgeDevice } from "../types";
import { discoverDevices, connectDevice, disconnectDevice, reconnectDevice } from "../adb";
import { createSession, endSession } from "../sessions";
import { recordEvent } from "../events";

/** Connect to a device and start a visual session. */
export function connect(deviceId: string): { device: BridgeDevice | undefined; sessionId: string } | null {
  const success = connectDevice(deviceId);
  if (!success) return null;
  const device = discoverDevices().find((d) => d.id === deviceId);
  const session = createSession(deviceId);
  recordEvent("lifecycle", { action: "connect", deviceId, sessionId: session.id });
  return { device, sessionId: session.id };
}

/** Disconnect from a device and end the visual session. */
export function disconnect(deviceId: string): boolean {
  const success = disconnectDevice(deviceId);
  if (!success) return false;
  recordEvent("lifecycle", { action: "disconnect", deviceId });
  return true;
}

/** Reconnect to a device. */
export function reconnect(deviceId: string): boolean {
  return reconnectDevice(deviceId);
}

/** Get all bridge devices. */
export function getDevices(): BridgeDevice[] {
  return discoverDevices();
}
