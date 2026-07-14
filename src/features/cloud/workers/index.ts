/**
 * @module features/cloud/workers
 *
 * Workers — manages multiple execution workers with health, capabilities,
 * load, availability, and heartbeat.
 */

import type { Worker } from "../types";
import { uid } from "@/lib/utils";

const workers: Worker[] = [
  { id: "worker-local-1", name: "Local Worker", type: "local", status: "idle", capabilities: ["build", "run", "test", "analyze", "pub"], cpuUsage: 15, memoryUsage: 32, maxJobs: 3, activeJobs: 0, lastHeartbeat: new Date().toISOString(), address: "localhost" },
  { id: "worker-docker-1", name: "Docker Worker 1", type: "docker", status: "idle", capabilities: ["build", "test", "analyze", "pub"], cpuUsage: 22, memoryUsage: 45, maxJobs: 2, activeJobs: 0, lastHeartbeat: new Date().toISOString() },
  { id: "worker-docker-2", name: "Docker Worker 2", type: "docker", status: "busy", capabilities: ["build", "test"], cpuUsage: 68, memoryUsage: 72, maxJobs: 2, activeJobs: 1, lastHeartbeat: new Date().toISOString() },
];

export function listWorkers(): Worker[] { return [...workers]; }
export function getIdleWorkers(): Worker[] { return workers.filter((w) => w.status === "idle" && w.activeJobs < w.maxJobs); }
export function getWorker(id: string): Worker | undefined { return workers.find((w) => w.id === id); }

export function assignJob(workerId: string): boolean {
  const w = workers.find((x) => x.id === workerId);
  if (!w || w.activeJobs >= w.maxJobs) return false;
  w.activeJobs++;
  if (w.activeJobs >= w.maxJobs) w.status = "busy";
  return true;
}

export function releaseJob(workerId: string): void {
  const w = workers.find((x) => x.id === workerId);
  if (w) { w.activeJobs = Math.max(0, w.activeJobs - 1); if (w.activeJobs === 0) w.status = "idle"; }
}

export function updateHeartbeat(workerId: string): void {
  const w = workers.find((x) => x.id === workerId);
  if (w) w.lastHeartbeat = new Date().toISOString();
}

export function addWorker(params: { name: string; type: Worker["type"]; capabilities: string[] }): Worker {
  const w: Worker = { id: uid("worker"), name: params.name, type: params.type, status: "idle", capabilities: params.capabilities, cpuUsage: 0, memoryUsage: 0, maxJobs: 2, activeJobs: 0, lastHeartbeat: new Date().toISOString() };
  workers.push(w);
  return w;
}

export function removeWorker(id: string): boolean {
  const idx = workers.findIndex((w) => w.id === id);
  if (idx === -1) return false;
  workers.splice(idx, 1);
  return true;
}
