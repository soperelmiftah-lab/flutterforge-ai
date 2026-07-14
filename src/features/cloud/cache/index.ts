/**
 * @module features/cloud/cache
 *
 * Cache — manages pub cache, Gradle cache, Flutter cache, and Docker cache.
 */

import type { CacheEntry } from "../types";

export function getCacheEntries(): CacheEntry[] {
  return [
    { type: "pub", path: "~/.pub-cache", sizeMb: 245, lastAccessed: new Date(Date.now() - 1800000).toISOString() },
    { type: "gradle", path: "~/.gradle/caches", sizeMb: 890, lastAccessed: new Date(Date.now() - 3600000).toISOString() },
    { type: "flutter", path: "~/flutter/bin/cache", sizeMb: 1200, lastAccessed: new Date(Date.now() - 86400000).toISOString() },
    { type: "docker", path: "/var/lib/docker", sizeMb: 7900, lastAccessed: new Date(Date.now() - 7200000).toISOString() },
  ];
}

export function getTotalCacheSize(): number { return getCacheEntries().reduce((s, e) => s + e.sizeMb, 0); }
export function getCacheByType(type: CacheEntry["type"]): CacheEntry | undefined { return getCacheEntries().find((e) => e.type === type); }
