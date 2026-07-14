/**
 * @module features/cloud/runtime
 *
 * Runtime Adapters — interchangeable execution backends. Every runtime
 * implements the same interface: Local, Docker, Remote, Cloud, CI.
 */

import type { RuntimeAdapter, RuntimeType } from "../types";

export const runtimeAdapters: RuntimeAdapter[] = [
  { type: "local", name: "Local Runtime", available: true, capabilities: ["build", "run", "test", "analyze", "pub"], config: { path: "/home/z/flutter" } },
  { type: "docker", name: "Docker Runtime", available: true, capabilities: ["build", "test", "analyze", "pub"], config: { image: "flutter:3.22.0" } },
  { type: "remote", name: "Remote Runtime", available: false, capabilities: ["build", "run", "test", "analyze"], config: { host: "remote-builder-1" } },
  { type: "cloud", name: "Cloud Runtime", available: false, capabilities: ["build", "test"], config: { provider: "aws" } },
  { type: "ci", name: "CI Runtime", available: false, capabilities: ["build", "test", "analyze"], config: { provider: "github-actions" } },
];

export function getAdapter(type: RuntimeType): RuntimeAdapter | undefined {
  return runtimeAdapters.find((a) => a.type === type);
}

export function getAvailableAdapters(): RuntimeAdapter[] {
  return runtimeAdapters.filter((a) => a.available);
}

/** Execute a command through the specified runtime adapter (mock). */
export async function executeOnRuntime(type: RuntimeType, command: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
  const start = Date.now();
  await new Promise((r) => setTimeout(r, 200));
  return {
    stdout: `[${type}] ${command} ${args.join(" ")} — executed successfully`,
    stderr: "",
    exitCode: 0,
    durationMs: Date.now() - start,
  };
}
