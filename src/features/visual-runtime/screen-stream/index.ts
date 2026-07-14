/**
 * @module features/visual-runtime/screen-stream
 *
 * Screen Stream — live preview stream abstraction. Start, stop, pause,
 * reconnect, multiple viewers.
 */

import type { ScreenStream } from "../types";
import { uid } from "@/lib/utils";

const streams: ScreenStream[] = [];

/** Start a screen stream for a device. */
export function startStream(deviceId: string): ScreenStream {
  // Stop any existing stream for this device.
  stopStream(deviceId);
  const stream: ScreenStream = {
    id: uid("stream"),
    deviceId,
    status: "streaming",
    fps: 30,
    startedAt: new Date().toISOString(),
    viewerCount: 1,
  };
  streams.push(stream);
  return stream;
}

/** Stop a stream. */
export function stopStream(deviceId: string): boolean {
  const stream = streams.find((s) => s.deviceId === deviceId && s.status !== "stopped");
  if (!stream) return false;
  stream.status = "stopped";
  return true;
}

/** Pause a stream. */
export function pauseStream(deviceId: string): boolean {
  const stream = streams.find((s) => s.deviceId === deviceId && s.status === "streaming");
  if (!stream) return false;
  stream.status = "paused";
  return true;
}

/** Resume a paused stream. */
export function resumeStream(deviceId: string): boolean {
  const stream = streams.find((s) => s.deviceId === deviceId && s.status === "paused");
  if (!stream) return false;
  stream.status = "streaming";
  return true;
}

/** Reconnect a stream. */
export function reconnectStream(deviceId: string): ScreenStream | null {
  stopStream(deviceId);
  return startStream(deviceId);
}

/** Get the active stream for a device. */
export function getActiveStream(deviceId: string): ScreenStream | undefined {
  return streams.find((s) => s.deviceId === deviceId && s.status !== "stopped");
}

/** Get all streams. */
export function getAllStreams(): ScreenStream[] {
  return [...streams].reverse();
}

/** Add a viewer to a stream. */
export function addViewer(streamId: string): void {
  const stream = streams.find((s) => s.id === streamId);
  if (stream) stream.viewerCount++;
}

/** Remove a viewer from a stream. */
export function removeViewer(streamId: string): void {
  const stream = streams.find((s) => s.id === streamId);
  if (stream) stream.viewerCount = Math.max(0, stream.viewerCount - 1);
}
