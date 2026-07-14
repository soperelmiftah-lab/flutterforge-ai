/**
 * @module features/cloud/state
 *
 * Shared in-memory Cloud Platform state. Persists across API calls via
 * globalThis (survives Next.js dev module re-evaluations).
 *
 * Holds: workers, jobs (queue + completed), builds, device farm, artifacts,
 * history, sessions, cost accumulator, cache entries, logs.
 *
 * The state class is the single source of truth — all modules (workers,
 * scheduler, builder, artifacts, etc.) delegate to this singleton.
 */

import type {
  Worker, WorkerStatus, CloudJob, JobType, JobStatus, RuntimeType,
  BuildFarmJob, BuildTarget, BuildMode, FarmDevice, FarmDeviceType,
  FarmDeviceStatus, Artifact, ArtifactType, CloudHistoryEntry,
  CloudMetrics, MonitoringSnapshot, CloudSession, CostEstimate,
  CacheEntry, CloudPolicies, RuntimeAdapter,
} from "../types";
import { uid } from "@/lib/utils";

const MAX_JOBS = 200;
const MAX_BUILDS = 50;
const MAX_ARTIFACTS = 100;
const MAX_HISTORY = 200;
const MAX_SESSIONS = 50;
const MAX_LOGS = 500;

// ─── Defaults ────────────────────────────────────────────────────────────

const DEFAULT_WORKERS: Worker[] = [
  { id: "worker-local-1", name: "Local Worker", type: "local", status: "idle", capabilities: ["build", "run", "test", "analyze", "pub"], cpuUsage: 15, memoryUsage: 32, maxJobs: 3, activeJobs: 0, lastHeartbeat: new Date().toISOString(), address: "localhost" },
  { id: "worker-docker-1", name: "Docker Worker 1", type: "docker", status: "idle", capabilities: ["build", "test", "analyze", "pub"], cpuUsage: 22, memoryUsage: 45, maxJobs: 2, activeJobs: 0, lastHeartbeat: new Date().toISOString(), address: "docker-host-1" },
  { id: "worker-docker-2", name: "Docker Worker 2", type: "docker", status: "idle", capabilities: ["build", "test"], cpuUsage: 18, memoryUsage: 38, maxJobs: 2, activeJobs: 0, lastHeartbeat: new Date().toISOString(), address: "docker-host-2" },
  { id: "worker-cloud-1", name: "Cloud Worker (AWS)", type: "cloud", status: "offline", capabilities: ["build", "test"], cpuUsage: 0, memoryUsage: 0, maxJobs: 4, activeJobs: 0, lastHeartbeat: new Date().toISOString(), address: "ec2-xx-xx-xx-xx" },
];

const DEFAULT_DEVICES: FarmDevice[] = [
  { id: "emulator-5554", name: "Pixel 7 API 34", type: "android-emulator", status: "available", capabilities: ["hot-reload", "screenshot", "logcat"] },
  { id: "emulator-5556", name: "Pixel 5 API 31", type: "android-emulator", status: "available", capabilities: ["hot-reload", "screenshot"] },
  { id: "chrome-1", name: "Chrome (desktop)", type: "chrome", status: "available", capabilities: ["hot-reload", "web-renderer"] },
  { id: "desktop-1", name: "Linux Desktop", type: "desktop", status: "available", capabilities: ["hot-reload"] },
  { id: "physical-pixel7", name: "Pixel 7 Pro (USB)", type: "android-physical", status: "offline", capabilities: ["hot-reload", "screenshot", "logcat"] },
];

const DEFAULT_ADAPTERS: RuntimeAdapter[] = [
  { type: "local", name: "Local Runtime", available: true, capabilities: ["build", "run", "test", "analyze", "pub"], config: { path: "/home/z/flutter" } },
  { type: "docker", name: "Docker Runtime", available: true, capabilities: ["build", "test", "analyze", "pub"], config: { image: "flutter:3.22.0" } },
  { type: "remote", name: "Remote Runtime", available: false, capabilities: ["build", "run", "test", "analyze"], config: { host: "remote-builder-1" } },
  { type: "cloud", name: "Cloud Runtime", available: false, capabilities: ["build", "test"], config: { provider: "aws" } },
  { type: "ci", name: "CI Runtime", available: false, capabilities: ["build", "test", "analyze"], config: { provider: "github-actions" } },
];

const DEFAULT_POLICIES: CloudPolicies = {
  maxConcurrentJobs: 8,
  maxRetries: 3,
  defaultTimeoutMs: 120_000,
  artifactRetentionDays: 30,
  autoScaleWorkers: false,
  minWorkers: 2,
  maxWorkers: 8,
};

const COST_PER_MINUTE: Record<RuntimeType, number> = {
  local: 0, docker: 0.01, remote: 0.05, cloud: 0.10, ci: 0.08,
};

// ─── State class ─────────────────────────────────────────────────────────

class CloudState {
  workers: Worker[] = DEFAULT_WORKERS.map((w) => ({ ...w }));
  devices: FarmDevice[] = DEFAULT_DEVICES.map((d) => ({ ...d }));
  adapters: RuntimeAdapter[] = DEFAULT_ADAPTERS.map((a) => ({ ...a }));
  policies: CloudPolicies = { ...DEFAULT_POLICIES };

  jobQueue: CloudJob[] = [];
  completedJobs: CloudJob[] = [];
  builds: BuildFarmJob[] = [];
  artifacts: Artifact[] = [];
  history: CloudHistoryEntry[] = [];
  sessions: CloudSession[] = [];
  cache: CacheEntry[] = [];
  logs: CloudLogEntry[] = [];
  totalCostUsd = 0;

  // ─── Workers ──────────────────────────────────────────────────────────

  listWorkers(): Worker[] { return [...this.workers]; }
  getIdleWorkers(): Worker[] { return this.workers.filter((w) => w.status === "idle" && w.activeJobs < w.maxJobs); }
  getWorker(id: string): Worker | undefined { return this.workers.find((w) => w.id === id); }

  addWorker(params: { name: string; type: RuntimeType; capabilities: string[] }): Worker {
    const w: Worker = {
      id: uid("worker"), name: params.name, type: params.type, status: "idle",
      capabilities: params.capabilities, cpuUsage: 0, memoryUsage: 0,
      maxJobs: 2, activeJobs: 0, lastHeartbeat: new Date().toISOString(),
    };
    this.workers.push(w);
    this.log("info", `Worker added: ${w.name} (${w.id})`);
    return w;
  }

  removeWorker(id: string): boolean {
    const idx = this.workers.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    const [removed] = this.workers.splice(idx, 1);
    this.log("info", `Worker removed: ${removed.name}`);
    return true;
  }

  toggleWorkerStatus(id: string): Worker | null {
    const w = this.workers.find((x) => x.id === id);
    if (!w) return null;
    w.status = w.status === "offline" ? "idle" : "offline";
    this.log("info", `Worker ${w.name} → ${w.status}`);
    return w;
  }

  assignJob(workerId: string): boolean {
    const w = this.workers.find((x) => x.id === workerId);
    if (!w || w.activeJobs >= w.maxJobs) return false;
    w.activeJobs++;
    w.cpuUsage = Math.min(100, w.cpuUsage + Math.random() * 20);
    w.memoryUsage = Math.min(100, w.memoryUsage + Math.random() * 15);
    if (w.activeJobs >= w.maxJobs) w.status = "busy";
    w.lastHeartbeat = new Date().toISOString();
    return true;
  }

  releaseJob(workerId: string): void {
    const w = this.workers.find((x) => x.id === workerId);
    if (!w) return;
    w.activeJobs = Math.max(0, w.activeJobs - 1);
    w.cpuUsage = Math.max(5, w.cpuUsage - Math.random() * 15);
    w.memoryUsage = Math.max(10, w.memoryUsage - Math.random() * 10);
    if (w.activeJobs === 0 && w.status !== "offline") w.status = "idle";
    w.lastHeartbeat = new Date().toISOString();
  }

  // ─── Jobs ─────────────────────────────────────────────────────────────

  enqueueJob(params: {
    type: JobType; command: string; args?: string[]; workingDirectory?: string;
    priority?: number; runtimeType?: RuntimeType; projectId?: string;
    timeoutMs?: number; maxRetries?: number; dependsOn?: string[];
    environment?: Record<string, string>;
  }): CloudJob {
    const job: CloudJob = {
      id: uid("job"), type: params.type, command: params.command, args: params.args ?? [],
      workingDirectory: params.workingDirectory ?? ".", priority: params.priority ?? 0,
      status: "queued", runtimeType: params.runtimeType ?? "local", projectId: params.projectId,
      enqueuedAt: new Date().toISOString(), stdout: [], stderr: [], retries: 0,
      maxRetries: params.maxRetries ?? this.policies.maxRetries, timeoutMs: params.timeoutMs ?? this.policies.defaultTimeoutMs,
      dependsOn: params.dependsOn ?? [], environment: params.environment ?? {},
    };
    this.jobQueue.push(job);
    this.jobQueue.sort((a, b) => b.priority - a.priority);
    this.log("info", `Job enqueued: ${job.id} (${job.type} — ${job.command} ${job.args.join(" ")})`);
    return job;
  }

  /** Process the queue: assign queued jobs to idle workers and execute them. */
  async processQueue(): Promise<void> {
    const idle = this.getIdleWorkers();
    if (idle.length === 0) return;
    const ready = this.jobQueue.filter(
      (j) => j.status === "queued" &&
        j.dependsOn.every((d) => this.completedJobs.find((c) => c.id === d && c.status === "success"))
    );
    if (ready.length === 0) return;

    for (const job of ready.slice(0, idle.length)) {
      const worker = idle.find((w) => w.activeJobs < w.maxJobs);
      if (!worker || !this.assignJob(worker.id)) continue;
      job.workerId = worker.id;
      job.status = "running";
      job.startedAt = new Date().toISOString();
      this.log("info", `Job ${job.id} assigned to ${worker.name}`);

      try {
        const result = await this.executeOnRuntime(job.runtimeType, job.command, job.args);
        job.stdout.push(result.stdout);
        job.stderr.push(result.stderr);
        job.exitCode = result.exitCode;
        job.status = result.exitCode === 0 ? "success" : "failed";
        job.durationMs = result.durationMs;
      } catch (e) {
        job.status = "failed";
        job.stderr.push(String(e));
        if (job.retries < job.maxRetries) {
          job.retries++;
          job.status = "queued";
          this.releaseJob(worker.id);
          this.log("warning", `Job ${job.id} retrying (${job.retries}/${job.maxRetries})`);
          continue;
        }
      }
      job.finishedAt = new Date().toISOString();
      this.completedJobs.unshift(job);
      if (this.completedJobs.length > MAX_JOBS) this.completedJobs.pop();
      const idx = this.jobQueue.findIndex((j) => j.id === job.id);
      if (idx >= 0) this.jobQueue.splice(idx, 1);
      this.releaseJob(worker.id);

      // Record history + cost.
      this.recordHistory({
        jobId: job.id, type: job.type, runtimeType: job.runtimeType,
        success: job.status === "success", durationMs: job.durationMs ?? 0,
        workerName: worker.name,
      });
      const minutes = (job.durationMs ?? 0) / 60000;
      this.totalCostUsd += COST_PER_MINUTE[job.runtimeType] * minutes;

      // Create artifact for build jobs.
      if (job.type === "build" && job.status === "success") {
        const target = job.args[1] ?? "apk";
        const artifactType: ArtifactType = target === "apk" ? "apk" : target === "aab" ? "aab" : "zip";
        const artifact = this.createArtifact({
          jobId: job.id, type: artifactType,
          name: `app-${target}.zip`, path: `/build/${target}/app-${target}.zip`,
          sizeMb: Math.round(Math.random() * 30 + 10),
        });
        this.log("info", `Artifact created: ${artifact.name} (${artifact.sizeMb}MB)`);
      }
    }
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobQueue.find((j) => j.id === jobId);
    if (!job || job.status === "running") return false;
    job.status = "cancelled";
    this.log("warning", `Job ${jobId} cancelled`);
    return true;
  }

  getQueue(): CloudJob[] { return [...this.jobQueue]; }
  getCompleted(limit = 20): CloudJob[] { return this.completedJobs.slice(0, limit); }
  getJob(id: string): CloudJob | undefined {
    return this.jobQueue.find((j) => j.id === id) ?? this.completedJobs.find((j) => j.id === id);
  }

  // ─── Builds ───────────────────────────────────────────────────────────

  queueBuild(params: {
    target: BuildTarget; mode: BuildMode; flavor?: string;
    parallel?: boolean; priority?: number; projectId?: string;
  }): BuildFarmJob {
    const job = this.enqueueJob({
      type: "build", command: "flutter",
      args: ["build", params.target, `--${params.mode}`, params.flavor ? `--flavor=${params.flavor}` : ""].filter(Boolean),
      priority: params.priority ?? 5, runtimeType: "local", projectId: params.projectId,
    });
    const build: BuildFarmJob = {
      id: uid("build"), target: params.target, mode: params.mode, flavor: params.flavor,
      status: "queued", priority: params.priority ?? 5, enqueuedAt: new Date().toISOString(),
      parallel: params.parallel ?? true,
    };
    this.builds.unshift(build);
    if (this.builds.length > MAX_BUILDS) this.builds.pop();
    // Link the build to the job.
    build.status = "running";
    build.startedAt = new Date().toISOString();
    build.workerId = job.workerId;
    this.log("info", `Build queued: ${params.target}/${params.mode} (job ${job.id})`);
    return build;
  }

  listBuilds(limit = 20): BuildFarmJob[] { return this.builds.slice(0, limit); }
  getActiveBuilds(): BuildFarmJob[] { return this.builds.filter((b) => b.status === "running" || b.status === "queued"); }

  // ─── Device Farm ──────────────────────────────────────────────────────

  listDevices(): FarmDevice[] { return [...this.devices]; }
  getAvailableDevices(): FarmDevice[] { return this.devices.filter((d) => d.status === "available"); }
  getDevice(id: string): FarmDevice | undefined { return this.devices.find((d) => d.id === id); }

  reserveDevice(id: string, reservedBy: string): boolean {
    const d = this.devices.find((x) => x.id === id);
    if (!d || d.status !== "available") return false;
    d.status = "reserved"; d.reservedBy = reservedBy; d.reservedAt = new Date().toISOString();
    this.log("info", `Device reserved: ${d.name} by ${reservedBy}`);
    return true;
  }

  releaseDevice(id: string): boolean {
    const d = this.devices.find((x) => x.id === id);
    if (!d) return false;
    d.status = "available"; d.reservedBy = undefined; d.reservedAt = undefined;
    this.log("info", `Device released: ${d.name}`);
    return true;
  }

  // ─── Artifacts ────────────────────────────────────────────────────────

  createArtifact(params: {
    jobId: string; type: ArtifactType; name: string; path: string;
    sizeMb: number; signed?: boolean; retentionDays?: number;
  }): Artifact {
    const a: Artifact = {
      id: uid("art"), jobId: params.jobId, type: params.type, name: params.name,
      path: params.path, sizeMb: params.sizeMb, createdAt: new Date().toISOString(),
      signed: params.signed ?? false,
      expiresAt: params.retentionDays ? new Date(Date.now() + params.retentionDays * 86400000).toISOString() : undefined,
    };
    this.artifacts.unshift(a);
    if (this.artifacts.length > MAX_ARTIFACTS) this.artifacts.pop();
    return a;
  }

  listArtifacts(type?: ArtifactType): Artifact[] {
    return type ? this.artifacts.filter((a) => a.type === type) : [...this.artifacts];
  }

  deleteArtifact(id: string): boolean {
    const idx = this.artifacts.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.artifacts.splice(idx, 1);
    return true;
  }

  // ─── History ──────────────────────────────────────────────────────────

  recordHistory(params: {
    jobId: string; type: JobType; runtimeType: RuntimeType;
    success: boolean; durationMs: number; workerName?: string;
  }): CloudHistoryEntry {
    const e: CloudHistoryEntry = { id: uid("chist"), ...params, timestamp: new Date().toISOString() };
    this.history.unshift(e);
    if (this.history.length > MAX_HISTORY) this.history.pop();
    return e;
  }

  listHistory(limit = 20): CloudHistoryEntry[] { return this.history.slice(0, limit); }

  // ─── Sessions ─────────────────────────────────────────────────────────

  createSession(projectId: string, runtimeType: RuntimeType): CloudSession {
    const s: CloudSession = {
      id: uid("csession"), projectId, runtimeType, status: "active",
      createdAt: new Date().toISOString(), jobs: [],
    };
    this.sessions.unshift(s);
    if (this.sessions.length > MAX_SESSIONS) this.sessions.pop();
    return s;
  }

  listSessions(): CloudSession[] { return [...this.sessions]; }

  // ─── Logs ─────────────────────────────────────────────────────────────

  log(level: CloudLogEntry["level"], message: string): void {
    this.logs.unshift({
      id: uid("clog"), level, message, timestamp: new Date().toISOString(),
    });
    if (this.logs.length > MAX_LOGS) this.logs.pop();
  }

  listLogs(limit = 100): CloudLogEntry[] { return this.logs.slice(0, limit); }
  clearLogs(): void { this.logs.length = 0; }

  // ─── Cache ────────────────────────────────────────────────────────────

  listCache(): CacheEntry[] { return [...this.cache]; }
  addCache(entry: Omit<CacheEntry, "lastAccessed">): void {
    this.cache.push({ ...entry, lastAccessed: new Date().toISOString() });
  }
  clearCache(): void { this.cache.length = 0; }

  // ─── Runtime Adapters ─────────────────────────────────────────────────

  listAdapters(): RuntimeAdapter[] { return [...this.adapters]; }
  getAvailableAdapters(): RuntimeAdapter[] { return this.adapters.filter((a) => a.available); }

  /** Execute a command on the specified runtime (simulated). */
  async executeOnRuntime(type: RuntimeType, command: string, args: string[] = []): Promise<{ stdout: string; stderr: string; exitCode: number; durationMs: number }> {
    const start = Date.now();
    const delay = type === "local" ? 100 + Math.random() * 200 : type === "docker" ? 300 + Math.random() * 400 : 500 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));
    const success = Math.random() > 0.1; // 90% success rate
    const cmd = `${command} ${args.join(" ")}`.trim();
    return {
      stdout: success ? `[${type}] ${cmd} — completed in ${Math.round(delay)}ms` : "",
      stderr: success ? "" : `[${type}] ${cmd} — failed (exit code 1)`,
      exitCode: success ? 0 : 1,
      durationMs: Date.now() - start,
    };
  }

  // ─── Cost ─────────────────────────────────────────────────────────────

  estimateCost(runtimeType: RuntimeType, estimatedDurationMs: number, workerUtilization = 0.5): CostEstimate {
    const minutes = estimatedDurationMs / 60000;
    return {
      runtimeType, estimatedDurationMs,
      estimatedCostUsd: Math.round(COST_PER_MINUTE[runtimeType] * minutes * 100) / 100,
      workerUtilization,
    };
  }

  getTotalCost(): number { return Math.round(this.totalCostUsd * 100) / 100; }

  // ─── Monitoring + Metrics ─────────────────────────────────────────────

  getSnapshot(): MonitoringSnapshot {
    const workers = this.workers;
    const successCount = this.completedJobs.filter((j) => j.status === "success").length;
    const durations = this.completedJobs.filter((j) => j.durationMs).map((j) => j.durationMs!);
    return {
      totalWorkers: workers.length,
      activeWorkers: workers.filter((w) => w.status !== "offline").length,
      queuedJobs: this.jobQueue.filter((j) => j.status === "queued").length,
      runningJobs: this.jobQueue.filter((j) => j.status === "running").length,
      completedJobs: successCount,
      failedJobs: this.completedJobs.filter((j) => j.status === "failed").length,
      averageCpu: Math.round(workers.reduce((s, w) => s + w.cpuUsage, 0) / Math.max(1, workers.length)),
      averageMemory: Math.round(workers.reduce((s, w) => s + w.memoryUsage, 0) / Math.max(1, workers.length)),
      successRate: this.completedJobs.length > 0 ? Math.round((successCount / this.completedJobs.length) * 100) / 100 : 0,
      averageDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
    };
  }

  computeMetrics(): CloudMetrics {
    const jobs = this.completedJobs;
    const totalJobs = jobs.length;
    const successCount = jobs.filter((j) => j.status === "success").length;
    const durations = jobs.filter((j) => j.durationMs).map((j) => j.durationMs!);
    const typeMap: Record<string, number> = {};
    for (const j of jobs) typeMap[j.type] = (typeMap[j.type] ?? 0) + 1;
    const runtimeMap: Record<string, number> = {};
    for (const j of jobs) runtimeMap[j.runtimeType] = (runtimeMap[j.runtimeType] ?? 0) + 1;
    return {
      totalJobs,
      totalBuilds: jobs.filter((j) => j.type === "build").length,
      successRate: totalJobs > 0 ? Math.round((successCount / totalJobs) * 100) / 100 : 0,
      averageDurationMs: durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0,
      workerUtilization: this.workers.length > 0 ? Math.round(this.workers.reduce((s, w) => s + (w.activeJobs / w.maxJobs), 0) / this.workers.length * 100) / 100 : 0,
      totalArtifacts: this.artifacts.length,
      cacheHitRate: 0.72,
      estimatedCostUsd: this.getTotalCost(),
      jobsByType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
      jobsByRuntime: Object.entries(runtimeMap).map(([runtime, count]) => ({ runtime, count })),
    };
  }
}

// Cloud log entry (internal type, not exported in types/index.ts).
export interface CloudLogEntry {
  id: string;
  level: "info" | "warning" | "error";
  message: string;
  timestamp: string;
}

// ─── Singleton (persists via globalThis) ─────────────────────────────────

const GLOBAL_KEY = "__cloudState__";

function getCloudState(): CloudState {
  if (typeof globalThis !== "undefined" && (globalThis as any)[GLOBAL_KEY]) {
    return (globalThis as any)[GLOBAL_KEY];
  }
  const state = new CloudState();
  state.log("info", "Cloud Platform initialized — 4 workers, 5 devices, 2 runtime adapters available");
  if (typeof globalThis !== "undefined") {
    (globalThis as any)[GLOBAL_KEY] = state;
  }
  return state;
}

export const cloudState = getCloudState();
