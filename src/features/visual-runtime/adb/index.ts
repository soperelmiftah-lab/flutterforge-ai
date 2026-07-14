/**
 * @module features/visual-runtime/adb
 *
 * ADB Device Bridge — discovers USB/wireless/emulator devices, handles
 * pairing, reconnection, and exposes device information.
 */

import type { BridgeDevice, PairingCode, BridgeConnection } from "../types";

/** Mock discovered devices (would run `adb devices -l` in production). */
const devices: BridgeDevice[] = [
  {
    id: "emulator-5554",
    serial: "emulator-5554",
    name: "sdk gphone64 arm64",
    connection: "emulator",
    isPaired: true,
    isConnected: true,
    manufacturer: "Google",
    model: "sdk_gphone64_arm64",
    abi: "arm64-v8a",
    sdkVersion: "34",
    androidVersion: "14",
    batteryLevel: 100,
    storageAvailableMb: 4096,
    storageTotalMb: 8192,
    memoryMb: 4096,
    resolution: "1080x2400",
    density: 420,
    orientation: "portrait",
  },
  {
    id: "192.168.1.100:5555",
    serial: "192.168.1.100:5555",
    name: "Pixel 7 Pro",
    connection: "wireless",
    isPaired: true,
    isConnected: false,
    manufacturer: "Google",
    model: "Pixel 7 Pro",
    abi: "arm64-v8a",
    sdkVersion: "34",
    androidVersion: "14",
    batteryLevel: 78,
    storageAvailableMb: 65536,
    storageTotalMb: 131072,
    memoryMb: 8192,
    resolution: "1440x3120",
    density: 560,
    orientation: "portrait",
  },
];

/** Discover available devices. */
export function discoverDevices(): BridgeDevice[] {
  return [...devices];
}

/** Get connected devices only. */
export function getConnectedDevices(): BridgeDevice[] {
  return devices.filter((d) => d.isConnected);
}

/** Get a device by id. */
export function getDevice(id: string): BridgeDevice | undefined {
  return devices.find((d) => d.id === id);
}

/** Connect to a device. */
export function connectDevice(id: string): boolean {
  const device = devices.find((d) => d.id === id);
  if (!device) return false;
  device.isConnected = true;
  return true;
}

/** Disconnect from a device. */
export function disconnectDevice(id: string): boolean {
  const device = devices.find((d) => d.id === id);
  if (!device) return false;
  device.isConnected = false;
  return true;
}

/** Generate a pairing code for wireless debugging. */
export function generatePairingCode(port: number = 5555): PairingCode {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  return {
    code,
    port,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}

/** Reconnect to a disconnected device. */
export function reconnectDevice(id: string): boolean {
  return connectDevice(id);
}

/** Get devices by connection type. */
export function getDevicesByConnection(connection: BridgeConnection): BridgeDevice[] {
  return devices.filter((d) => d.connection === connection);
}
