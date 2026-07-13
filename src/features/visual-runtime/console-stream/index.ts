/**
 * @module features/visual-runtime/console-stream
 *
 * Console Stream — collects runtime exceptions, Flutter logs, Dart
 * exceptions, and platform exceptions.
 */

import type { ConsoleEntry, ConsoleLevel, ConsoleSource } from "../types";
import { uid } from "@/lib/utils";

const entries: ConsoleEntry[] = [];
const MAX = 500;

/** Add a console entry. */
export function addEntry(level: ConsoleLevel, source: ConsoleSource, message: string, stackTrace?: string): ConsoleEntry {
  const entry: ConsoleEntry = { id: uid("console"), level, source, message, timestamp: new Date().toISOString(), stackTrace };
  entries.unshift(entry);
  if (entries.length > MAX) entries.pop();
  return entry;
}

/** Get console entries. */
export function getEntries(filter?: { level?: ConsoleLevel; source?: ConsoleSource; query?: string; limit?: number }): ConsoleEntry[] {
  let out = [...entries];
  if (filter?.level) out = out.filter((e) => e.level === filter.level);
  if (filter?.source) out = out.filter((e) => e.source === filter.source);
  if (filter?.query) {
    const q = filter.query.toLowerCase();
    out = out.filter((e) => e.message.toLowerCase().includes(q));
  }
  return out.slice(0, filter?.limit ?? 100);
}

/** Clear all entries. */
export function clearEntries(): void {
  entries.length = 0;
}

/** Seed mock entries for UI. */
export function seedMockEntries(): void {
  addEntry("info", "flutter", "Flutter 3.22.0 starting...");
  addEntry("info", "dart", "Dart VM initialized");
  addEntry("info", "flutter", "App is running on emulator-5554");
  addEntry("warning", "flutter", "setState() called during build()");
  addEntry("error", "dart", "Unhandled exception: FormatException: Invalid radix-10 number");
  addEntry("error", "platform", "PlatformException(code: 403, message: Permission denied)");
}

seedMockEntries();
