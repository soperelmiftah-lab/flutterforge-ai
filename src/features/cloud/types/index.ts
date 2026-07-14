/**
 * @module features/cloud/types
 *
 * Core domain types for the Cloud Development Platform.
 */

// ─── Runtime Adapters ───────────────────────────────────────────────────

export type RuntimeType = "local" | "docker" | "remote" | "cloud" | "ci";

export interface RuntimeAdapter {
  type: RuntimeType;
  name: string;
  available: boolean;
  capabilities: string[];
  config: Record<string, unknown>;
}

// ─── Workers ────────────────────────────────────────────────────────────

export type WorkerStatus = "idle" | "busy" | "offline" | "error";

export interface Worker {
  id: string;
  name: string;
  type: RuntimeType;
  status: WorkerStatus;
  capabilities: string[];
  cpuUsage: number;
  memoryUsage: number;
  maxJobs: number;
  activeJobs: number;
  lastHeartbeat: string;
  address?: string;
}

// ─── Jobs ───────────────────────────────────────────────────────────────

export type JobType = "build" | "run" | "test" | "analyze" | "pub" | "custom";
export type JobStatus = "queued" | "running" | "success" | "failed" | "cancelled" | "timeout";

export interface CloudJob {
  id: string;
  type: JobType;
  command: string;
  args: string[];
  workingDirectory: string;
  priority: number;
  status: JobStatus;
  runtimeType: RuntimeType;
  workerId?: string;
  projectId?: string;
  enqueuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  exitCode?: number;
  stdout: string[];
  stderr: string[];
  retries: number;
  maxRetries: number;
  timeoutMs: number;
  dependsOn: string[];
  environment: Record<string, string>;
}

// ─── Device Farm ────────────────────────────────────────────────────────

export type FarmDeviceType = "android-emulator" | "android-physical" | "chrome" | "desktop" | "ios-simulator";
export type FarmDeviceStatus = "available" | "reserved" | "busy" | "offline";

export interface FarmDevice {
  id: string;
  name: string;
  type: FarmDeviceType;
  status: FarmDeviceStatus;
  workerId?: string;
  reservedBy?: string;
  reservedAt?: string;
  capabilities: string[];
}

// ─── Artifacts ──────────────────────────────────────────────────────────

export type ArtifactType = "apk" | "aab" | "zip" | "coverage" | "logs" | "report" | "screenshot";

export interface Artifact {
  id: string;
  jobId: string;
  type: ArtifactType;
  name: string;
  path: string;
  sizeMb: number;
  createdAt: string;
  expiresAt?: string;
  signed: boolean;
}

// ─── Docker ─────────────────────────────────────────────────────────────

export interface DockerImage {
  id: string;
  name: string;
  tag: string;
  flutterVersion: string;
  androidSdk?: boolean;
  cachedLayers: number;
  sizeMb: number;
}

// ─── Build Farm ─────────────────────────────────────────────────────────

export type BuildTarget = "apk" | "aab" | "web" | "windows" | "linux" | "macos";
export type BuildMode = "debug" | "profile" | "release";

export interface BuildFarmJob {
  id: string;
  target: BuildTarget;
  mode: BuildMode;
  flavor?: string;
  status: JobStatus;
  workerId?: string;
  priority: number;
  enqueuedAt: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  artifactId?: string;
  parallel: boolean;
}

// ─── Monitoring ─────────────────────────────────────────────────────────

export interface MonitoringSnapshot {
  totalWorkers: number;
  activeWorkers: number;
  queuedJobs: number;
  runningJobs: number;
  completedJobs: number;
  failedJobs: number;
  averageCpu: number;
  averageMemory: number;
  successRate: number;
  averageDurationMs: number;
}

// ─── Cache ──────────────────────────────────────────────────────────────

export interface CacheEntry {
  type: "pub" | "gradle" | "flutter" | "docker";
  path: string;
  sizeMb: number;
  lastAccessed: string;
}

// ─── Cost ───────────────────────────────────────────────────────────────

export interface CostEstimate {
  runtimeType: RuntimeType;
  estimatedDurationMs: number;
  estimatedCostUsd: number;
  workerUtilization: number;
}

// ─── Security ───────────────────────────────────────────────────────────

export interface SecurityConfig {
  workerAuth: boolean;
  artifactSigning: boolean;
  encryptedSecrets: boolean;
  temporaryCredentials: boolean;
}

// ─── Sessions ───────────────────────────────────────────────────────────

export interface CloudSession {
  id: string;
  projectId: string;
  runtimeType: RuntimeType;
  workerId?: string;
  deviceId?: string;
  status: "active" | "completed" | "failed";
  createdAt: string;
  jobs: string[];
}

// ─── Metrics ────────────────────────────────────────────────────────────

export interface CloudMetrics {
  totalJobs: number;
  totalBuilds: number;
  successRate: number;
  averageDurationMs: number;
  workerUtilization: number;
  totalArtifacts: number;
  cacheHitRate: number;
  estimatedCostUsd: number;
  jobsByType: Array<{ type: string; count: number }>;
  jobsByRuntime: Array<{ runtime: string; count: number }>;
}

// ─── History ────────────────────────────────────────────────────────────

export interface CloudHistoryEntry {
  id: string;
  jobId: string;
  type: JobType;
  runtimeType: RuntimeType;
  success: boolean;
  durationMs: number;
  workerName?: string;
  timestamp: string;
}

// ─── Policies ───────────────────────────────────────────────────────────

export interface CloudPolicies {
  maxConcurrentJobs: number;
  maxRetries: number;
  defaultTimeoutMs: number;
  artifactRetentionDays: number;
  autoScaleWorkers: boolean;
  minWorkers: number;
  maxWorkers: number;
}
