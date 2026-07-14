/**
 * @module features/flutter-runtime/state
 *
 * Shared in-memory runtime state. Persists across API calls within the same
 * server process. Holds:
 *   - device registry (attached devices + emulators)
 *   - run sessions (active Flutter app runs)
 *   - build jobs (queued / running / completed)
 *   - log buffer (rolling, capped at MAX_LOGS)
 *   - history (every runtime action)
 *   - metrics (computed from history)
 *
 * Note: this is a *simulated* Flutter SDK runtime. There is no real Flutter
 * process; instead, each operation mutates state and emits realistic log
 * entries. The simulation is stateful — sessions persist, logs accumulate,
 * hot reload actually updates the session counter, builds actually progress
 * through queued → running → success, etc.
 */

import type {
  DeviceInfo,
  EmulatorInfo,
  RunSession,
  BuildJob,
  BuildConfig,
  RunConfig,
  LogEntry,
  LogLevel,
  RuntimeHistoryEntry,
  HistoryAction,
  ProcessInfo,
  RuntimeSession,
  RuntimeMetrics,
  SdkInfo,
  EnvironmentInfo,
  DoctorResult,
  AnalyzeResult,
  AnalyzeDiagnostic,
  TestResult,
  PubResult,
  PubCommand,
  HotReloadResult,
} from "../types";
import { uid } from "@/lib/utils";

// ─── Defaults ────────────────────────────────────────────────────────────

const MAX_LOGS = 500;
const MAX_HISTORY = 200;

const DEFAULT_SDK: SdkInfo = {
  version: "3.22.0",
  channel: "stable",
  dartVersion: "3.4.0",
  path: "/opt/flutter",
  isCurrent: true,
  isValid: true,
};

const DEFAULT_ENV: EnvironmentInfo = {
  os: "linux",
  arch: "x64",
  java: { version: "17.0.10" },
  gradle: { version: "8.5" },
  androidSdk: { path: "/opt/android-sdk", version: "34" },
  adb: { path: "/opt/android-sdk/platform-tools/adb", version: "1.0.41" },
  chrome: { path: "/opt/google-chrome/chrome", version: "120.0" },
  git: { version: "2.39.3" },
  pathEntries: ["/opt/flutter/bin", "/opt/android-sdk/platform-tools", "/usr/local/bin"],
  environmentVariables: {
    FLUTTER_ROOT: "/opt/flutter",
    ANDROID_HOME: "/opt/android-sdk",
    DART_SDK: "/opt/flutter/bin/cache/dart-sdk",
  },
};

const DEFAULT_DEVICES: DeviceInfo[] = [
  {
    id: "chrome-1",
    name: "Chrome (web)",
    platform: "web",
    isEmulator: false,
    isPhysical: true,
    isWireless: false,
    architecture: "x64",
    resolution: "1280x720",
    capabilities: ["hot-reload", "web-renderer", "canvas-kit"],
    isBooted: true,
  },
  {
    id: "emulator-5554",
    name: "Pixel 7 API 34",
    platform: "android",
    isEmulator: true,
    isPhysical: false,
    isWireless: false,
    architecture: "arm64",
    resolution: "1080x2400",
    batteryLevel: 87,
    capabilities: ["hot-reload", "screenshot", "logs", "hot-restart"],
    isBooted: true,
  },
];

const DEFAULT_EMULATORS: EmulatorInfo[] = [
  { id: "Pixel_7_API_34", name: "Pixel 7 API 34", platform: "android", isRunning: true, hasSnapshot: true },
  { id: "Pixel_6_API_33", name: "Pixel 6 API 33", platform: "android", isRunning: false, hasSnapshot: true },
  { id: "iPhone_15_Pro", name: "iPhone 15 Pro (sim)", platform: "ios", isRunning: false, hasSnapshot: false },
];

// ─── State containers ────────────────────────────────────────────────────

class RuntimeState {
  sdk: SdkInfo = DEFAULT_SDK;
  environment: EnvironmentInfo = DEFAULT_ENV;
  devices: DeviceInfo[] = [...DEFAULT_DEVICES];
  emulators: EmulatorInfo[] = [...DEFAULT_EMULATORS];
  sessions: Map<string, RunSession> = new Map();
  buildJobs: Map<string, BuildJob> = new Map();
  logs: LogEntry[] = [];
  history: RuntimeHistoryEntry[] = [];
  processes: ProcessInfo[] = [];
  activeSessionId: string | null = null;

  // ─── Devices ──────────────────────────────────────────────────────────

  listDevices(): DeviceInfo[] {
    return [...this.devices];
  }

  listBootedDevices(): DeviceInfo[] {
    return this.devices.filter((d) => d.isBooted);
  }

  getDevice(id: string): DeviceInfo | undefined {
    return this.devices.find((d) => d.id === id);
  }

  attachDevice(device: DeviceInfo): DeviceInfo {
    this.devices.push(device);
    this.log("info", "device", `Device attached: ${device.name} (${device.platform})`);
    return device;
  }

  detachDevice(id: string): boolean {
    const idx = this.devices.findIndex((d) => d.id === id);
    if (idx === -1) return false;
    const [removed] = this.devices.splice(idx, 1);
    this.log("info", "device", `Device detached: ${removed.name}`);
    return true;
  }

  // ─── Emulators ────────────────────────────────────────────────────────

  listEmulators(): EmulatorInfo[] {
    return [...this.emulators];
  }

  startEmulator(id: string): boolean {
    const emu = this.emulators.find((e) => e.id === id);
    if (!emu || emu.isRunning) return !!emu;
    emu.isRunning = true;
    this.log("info", "runtime", `Emulator started: ${emu.name}`);
    // Also add as a booted device.
    if (!this.devices.find((d) => d.id === emu.id)) {
      this.devices.push({
        id: emu.id,
        name: emu.name,
        platform: emu.platform,
        isEmulator: true,
        isPhysical: false,
        isWireless: false,
        capabilities: ["hot-reload", "screenshot"],
        isBooted: true,
      });
    }
    return true;
  }

  stopEmulator(id: string): boolean {
    const emu = this.emulators.find((e) => e.id === id);
    if (!emu || !emu.isRunning) return !!emu;
    emu.isRunning = false;
    this.log("info", "runtime", `Emulator stopped: ${emu.name}`);
    // Remove from booted devices.
    this.devices = this.devices.filter((d) => d.id !== emu.id);
    return true;
  }

  // ─── Logs ─────────────────────────────────────────────────────────────

  log(level: LogLevel, source: LogEntry["source"], message: string, pid?: number): LogEntry {
    const entry: LogEntry = {
      id: uid("log"),
      level,
      source,
      message,
      timestamp: new Date().toISOString(),
      pid,
    };
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) this.logs.shift();
    return entry;
  }

  listLogs(filter?: { level?: LogLevel; source?: string; sessionId?: string; limit?: number }): LogEntry[] {
    let out = [...this.logs];
    if (filter?.level) out = out.filter((l) => l.level === filter.level);
    if (filter?.source) out = out.filter((l) => l.source === filter.source);
    if (filter?.sessionId) {
      const sess = this.sessions.get(filter.sessionId);
      if (sess) {
        // Sessions have their own log buffer.
        out = sess.logs.map((msg, i) => ({
          id: `${sess.id}_log_${i}`,
          level: "info" as LogLevel,
          source: "flutter" as const,
          message: msg,
          timestamp: sess.startedAt,
          pid: sess.pid,
        }));
      }
    }
    const limit = filter?.limit ?? 200;
    return out.slice(-limit).reverse();
  }

  logStats(): Record<LogLevel, number> {
    const stats: Record<LogLevel, number> = { debug: 0, info: 0, warning: 0, error: 0, fatal: 0 };
    for (const l of this.logs) stats[l.level]++;
    return stats;
  }

  clearLogs(): void {
    this.logs.length = 0;
  }

  // ─── Run sessions ─────────────────────────────────────────────────────

  startSession(projectId: string, config: RunConfig): RunSession {
    const session: RunSession = {
      id: uid("run"),
      projectId,
      config,
      status: "starting",
      deviceId: config.deviceId,
      startedAt: new Date().toISOString(),
      pid: Math.floor(Math.random() * 90000) + 10000,
      logs: [
        `flutter run -d ${config.deviceId}`,
        "Launching lib/main.dart on ${config.deviceId}...",
        "Building Dart code...",
        "Compiling to kernel...",
      ],
      hotReloadCount: 0,
      hotRestartCount: 0,
    };
    this.sessions.set(session.id, session);
    this.activeSessionId = session.id;
    this.log("info", "runtime", `Run session started: ${session.id} (device: ${config.deviceId})`, session.pid);

    // Simulate startup progression.
    setTimeout(() => {
      session.status = "running";
      session.logs.push("Flutter run key commands:", "r 🔥 hot reload", "R 🔥 hot restart", "q quit");
      this.log("info", "runtime", `App is running on ${config.deviceId} (PID ${session.pid})`, session.pid);
    }, 200);

    // Track as a process.
    this.processes.push({
      pid: session.pid!,
      name: `flutter run -d ${config.deviceId}`,
      status: "running",
      cpu: 12.4,
      memory: 234,
      startedAt: session.startedAt,
      durationMs: 0,
    });

    this.recordHistory("run", projectId, true, 200, `Started on ${config.deviceId}`);
    return session;
  }

  getSession(id: string): RunSession | undefined {
    return this.sessions.get(id);
  }

  getActiveSession(): RunSession | null {
    if (!this.activeSessionId) return null;
    return this.sessions.get(this.activeSessionId) ?? null;
  }

  listSessions(): RunSession[] {
    return Array.from(this.sessions.values()).reverse();
  }

  stopSession(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.status = "stopped";
    session.logs.push("Application stopped.");
    this.log("info", "runtime", `Run session stopped: ${id}`, session.pid);
    // Remove from processes.
    this.processes = this.processes.filter((p) => p.pid !== session.pid);
    if (this.activeSessionId === id) this.activeSessionId = null;
    return true;
  }

  hotReload(sessionId?: string): HotReloadResult {
    const session = sessionId
      ? this.sessions.get(sessionId)
      : this.getActiveSession();
    if (!session || session.status !== "running") {
      return { success: false, durationMs: 0, message: "No active running session" };
    }
    const start = Date.now();
    const durationMs = Math.floor(Math.random() * 200) + 80;
    session.hotReloadCount++;
    session.logs.push(`🔥 Hot reload #${session.hotReloadCount} (${durationMs}ms)`);
    this.log("info", "flutter", `Hot reload completed in ${durationMs}ms (session ${session.id})`, session.pid);
    void start;
    this.recordHistory("hotreload", session.projectId, true, durationMs, `Reload #${session.hotReloadCount}`);
    return { success: true, durationMs, message: `Hot reload completed in ${durationMs}ms` };
  }

  hotRestart(sessionId?: string): HotReloadResult {
    const session = sessionId
      ? this.sessions.get(sessionId)
      : this.getActiveSession();
    if (!session || session.status !== "running") {
      return { success: false, durationMs: 0, message: "No active running session" };
    }
    const start = Date.now();
    const durationMs = Math.floor(Math.random() * 400) + 250;
    session.hotRestartCount++;
    session.logs.push(`🔥🔥 Hot restart #${session.hotRestartCount} (${durationMs}ms) — restarting app...`);
    this.log("info", "flutter", `Hot restart completed in ${durationMs}ms (session ${session.id})`, session.pid);
    void start;
    this.recordHistory("hotrestart", session.projectId, true, durationMs, `Restart #${session.hotRestartCount}`);
    return { success: true, durationMs, message: `Hot restart completed in ${durationMs}ms` };
  }

  // ─── Build jobs ───────────────────────────────────────────────────────

  queueBuild(config: BuildConfig): BuildJob {
    const job: BuildJob = {
      id: uid("build"),
      config,
      status: "queued",
      progress: 0,
      startedAt: undefined,
      finishedAt: undefined,
      logs: [],
    };
    this.buildJobs.set(job.id, job);
    this.log("info", "build", `Build queued: ${config.target}/${config.mode} (${job.id})`);
    return job;
  }

  /** Run a build synchronously, updating the job's state and logs. */
  async runBuild(jobId: string): Promise<BuildJob> {
    const job = this.buildJobs.get(jobId);
    if (!job) throw new Error(`Build job not found: ${jobId}`);

    job.status = "running";
    job.startedAt = new Date().toISOString();
    this.log("info", "build", `Build started: ${job.config.target}/${job.config.mode}`);

    const steps = buildSteps(job.config);
    for (const step of steps) {
      job.logs.push(step.message);
      await sleep(step.durationMs);
      job.progress = Math.min(99, job.progress + step.progressInc);
    }

    job.progress = 100;
    job.status = "success";
    job.finishedAt = new Date().toISOString();
    job.durationMs = Date.now() - new Date(job.startedAt).getTime();
    job.artifactPath = artifactPath(job.config);
    job.logs.push(`✓ Built ${job.config.target} (${(job.durationMs / 1000).toFixed(1)}s)`);
    job.logs.push(`  → ${job.artifactPath}`);
    this.log("info", "build", `Build completed: ${job.config.target} in ${job.durationMs}ms → ${job.artifactPath}`);
    this.recordHistory("build", undefined, true, job.durationMs, `${job.config.target}/${job.config.mode}`);
    return job;
  }

  getBuildJob(id: string): BuildJob | undefined {
    return this.buildJobs.get(id);
  }

  listBuildJobs(): BuildJob[] {
    return Array.from(this.buildJobs.values()).reverse();
  }

  // ─── Processes ────────────────────────────────────────────────────────

  listProcesses(): ProcessInfo[] {
    return [...this.processes];
  }

  killProcess(pid: number): boolean {
    const idx = this.processes.findIndex((p) => p.pid === pid);
    if (idx === -1) return false;
    this.processes[idx].status = "terminated";
    this.processes.splice(idx, 1);
    this.log("info", "runtime", `Process terminated: PID ${pid}`);
    // Also stop any matching run session.
    for (const session of this.sessions.values()) {
      if (session.pid === pid) {
        session.status = "stopped";
        session.logs.push("Process killed.");
      }
    }
    return true;
  }

  // ─── History + metrics ────────────────────────────────────────────────

  recordHistory(action: HistoryAction, projectId: string | undefined, success: boolean, durationMs: number, details?: string): void {
    const entry: RuntimeHistoryEntry = {
      id: uid("hist"),
      action,
      projectId,
      success,
      durationMs,
      timestamp: new Date().toISOString(),
      details,
    };
    this.history.push(entry);
    if (this.history.length > MAX_HISTORY) this.history.shift();
  }

  listHistory(): RuntimeHistoryEntry[] {
    return [...this.history].reverse();
  }

  computeMetrics(): RuntimeMetrics {
    const builds = this.history.filter((h) => h.action === "build");
    const runs = this.history.filter((h) => h.action === "run");
    const hotReloads = this.history.filter((h) => h.action === "hotreload" || h.action === "hotrestart");
    const avg = (arr: number[]) => (arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);

    return {
      runCount: runs.length,
      buildCount: builds.length,
      analyzeCount: this.history.filter((h) => h.action === "analyze").length,
      testCount: this.history.filter((h) => h.action === "test").length,
      pubCount: this.history.filter((h) => h.action === "pub").length,
      averageBuildTimeMs: avg(builds.map((b) => b.durationMs)),
      averageStartupTimeMs: avg(runs.map((r) => r.durationMs)),
      crashCount: this.history.filter((h) => !h.success && (h.action === "run" || h.action === "build")).length,
      hotReloadCount: hotReloads.length,
      averageHotReloadDurationMs: avg(hotReloads.map((h) => h.durationMs)),
    };
  }

  // ─── Doctor + analyze (deterministic, derived from env) ───────────────

  runDoctor(): DoctorResult {
    const checks = [
      { id: "flutter", label: "Flutter SDK", status: "pass" as const, message: `Flutter ${this.sdk.version} on ${this.sdk.channel}`, recommendation: undefined },
      { id: "dart", label: "Dart", status: "pass" as const, message: `Dart ${this.sdk.dartVersion}`, recommendation: undefined },
      { id: "android", label: "Android SDK", status: this.environment.androidSdk ? "pass" as const : "warning" as const, message: this.environment.androidSdk ? `Android SDK ${this.environment.androidSdk.version}` : "Not installed", recommendation: this.environment.androidSdk ? undefined : "Install Android SDK" },
      { id: "java", label: "Java", status: this.environment.java ? "pass" as const : "warning" as const, message: this.environment.java ? `Java ${this.environment.java.version}` : "Not installed", recommendation: this.environment.java ? undefined : "Install JDK 17+" },
      { id: "chrome", label: "Chrome", status: this.environment.chrome ? "pass" as const : "warning" as const, message: this.environment.chrome ? `Chrome ${this.environment.chrome.version}` : "Not installed", recommendation: this.environment.chrome ? undefined : "Install Chrome for web debugging" },
      { id: "devices", label: "Connected devices", status: this.devices.length > 0 ? "pass" as const : "warning" as const, message: `${this.listBootedDevices().length} device(s) booted`, recommendation: this.devices.length > 0 ? undefined : "Connect a device or start an emulator" },
      { id: "git", label: "Git", status: this.environment.git ? "pass" as const : "warning" as const, message: this.environment.git ? `Git ${this.environment.git.version}` : "Not installed", recommendation: this.environment.git ? undefined : "Install git" },
    ];
    const overall = checks.some((c) => c.status === "error") ? "error" :
      checks.some((c) => c.status === "warning") ? "warning" : "pass";
    const summary = `${checks.length} checks: ${checks.filter((c) => c.status === "pass").length} passed, ${checks.filter((c) => c.status === "warning").length} warnings, ${checks.filter((c) => c.status === "error").length} errors`;
    this.log("info", "runtime", `flutter doctor → ${overall}`);
    return { checks, overall, summary };
  }

  /** Run a (simulated) `flutter analyze` against the VFS. */
  analyzeVfs(files: Array<{ path: string; content: string }>): AnalyzeResult {
    const start = Date.now();
    const diagnostics: AnalyzeDiagnostic[] = [];
    for (const f of files) {
      if (!f.path.endsWith(".dart")) continue;
      const lines = f.content.split("\n");
      lines.forEach((line, i) => {
        // prefer_const_constructors
        if (/\b(Text|Container|Padding|Center|SizedBox|Column|Row|Scaffold|AppBar)\(['"]/.test(line) && !/\bconst\s+\w/.test(line)) {
          diagnostics.push({
            id: uid("diag"), severity: "info", code: "prefer_const_constructors",
            message: "Prefer const with constant constructors.",
            file: f.path, line: i + 1, column: line.indexOf("(") + 1,
            quickFix: "Add `const` before the constructor.",
          });
        }
        // avoid_print
        if (/\bprint\s*\(/.test(line)) {
          diagnostics.push({
            id: uid("diag"), severity: "warning", code: "avoid_print",
            message: "Avoid `print` calls in production code.",
            file: f.path, line: i + 1, column: line.indexOf("print") + 1,
            quickFix: "Use a logging package instead.",
          });
        }
        // unused_import (rough)
        if (/^import\s+['"]/.test(line) && /^unused_import/.test(line)) {
          diagnostics.push({
            id: uid("diag"), severity: "warning", code: "unused_import",
            message: "Unused import.", file: f.path, line: i + 1, column: 1,
          });
        }
      });
    }
    const result: AnalyzeResult = {
      diagnostics,
      errorCount: diagnostics.filter((d) => d.severity === "error").length,
      warningCount: diagnostics.filter((d) => d.severity === "warning").length,
      infoCount: diagnostics.filter((d) => d.severity === "info").length,
      success: true,
      durationMs: Date.now() - start,
    };
    this.log("info", "runtime", `flutter analyze → ${result.errorCount} errors, ${result.warningCount} warnings, ${result.infoCount} infos`);
    this.recordHistory("analyze", undefined, true, result.durationMs, `${result.warningCount} warning(s)`);
    return result;
  }

  /** Run a (simulated) `flutter test`. */
  runTest(type: TestResult["type"] = "unit"): TestResult {
    const start = Date.now();
    const passed = Math.floor(Math.random() * 15) + 5;
    const failed = Math.floor(Math.random() * 2);
    const skipped = Math.floor(Math.random() * 3);
    const coverage = Math.floor(Math.random() * 30) + 60;
    const durationMs = Math.floor(Math.random() * 1500) + 500;
    const success = failed === 0;
    const result: TestResult = {
      type, passed, failed, skipped, coverage, durationMs,
      output: `Running tests...\n+${passed} -${failed} ~${skipped}: All tests ${success ? "passed" : "failed"}\nCoverage: ${coverage}%`,
      success,
    };
    void start;
    this.log(success ? "info" : "warning", "test", `flutter test → ${passed} passed, ${failed} failed, ${skipped} skipped (${coverage}% coverage)`);
    this.recordHistory("test", undefined, success, durationMs, `${passed} passed, ${failed} failed`);
    return result;
  }

  /** Run a (simulated) `flutter pub` command. */
  runPub(command: PubCommand): PubResult {
    const start = Date.now();
    const outputs: Record<PubCommand, string> = {
      get: "Resolving dependencies...\n+ flutter_riverpod 2.5.1\n+ dio 5.4.3\n+ go_router 14.0.2\nChanged 3 dependencies!",
      upgrade: "Resolving dependencies...\nUpgraded 7 packages.",
      downgrade: "Downgraded 3 packages.",
      outdated: "3 packages have newer versions.",
      deps: "|-- flutter_riverpod 2.5.1\n|-- dio 5.4.3\n|-- go_router 14.0.2",
      "cache-repair": "Repaired 12 packages in cache.",
    };
    const packagesAffected = command === "get" ? 3 : command === "upgrade" ? 7 : command === "downgrade" ? 3 : 0;
    const durationMs = Math.floor(Math.random() * 500) + 200;
    const result: PubResult = {
      command, success: true, output: outputs[command], durationMs, packagesAffected,
    };
    void start;
    this.log("info", "runtime", `flutter pub ${command} → ${packagesAffected} package(s) affected (${durationMs}ms)`);
    this.recordHistory("pub", undefined, true, durationMs, `pub ${command}`);
    return result;
  }

  // ─── Runtime sessions (top-level) ─────────────────────────────────────

  listRuntimeSessions(): RuntimeSession[] {
    return this.listSessions().map((s) => ({
      id: s.id,
      projectId: s.projectId,
      status: s.status === "running" ? "active" : s.status === "stopped" ? "stopped" : "paused",
      startedAt: s.startedAt,
      flutterVersion: this.sdk.version,
      deviceId: s.deviceId,
      runSession: s,
      buildJobs: this.listBuildJobs(),
      logCount: s.logs.length,
    }));
  }
}

/** Build steps for a build job (simulated). */
function buildSteps(config: BuildConfig): Array<{ message: string; durationMs: number; progressInc: number }> {
  const target = config.target.toUpperCase();
  return [
    { message: `Building ${target} in ${config.mode} mode...`, durationMs: 200, progressInc: 5 },
    { message: "Resolving dependencies...", durationMs: 300, progressInc: 10 },
    { message: "Compiling Dart to kernel...", durationMs: 400, progressInc: 20 },
    { message: config.target === "web" ? "Compiling to JavaScript..." : "Compiling native code...", durationMs: 800, progressInc: 30 },
    { message: "Packing assets...", durationMs: 200, progressInc: 15 },
    { message: config.target === "apk" || config.target === "aab" ? "Running Gradle build..." : "Finalizing build...", durationMs: 600, progressInc: 15 },
    { message: "Writing artifact...", durationMs: 100, progressInc: 5 },
  ];
}

function artifactPath(config: BuildConfig): string {
  switch (config.target) {
    case "apk": return `/build/app/outputs/apk/${config.mode}/app-${config.mode}.apk`;
    case "aab": return `/build/app/outputs/bundle/${config.mode}/app-${config.mode}.aab`;
    case "web": return "/build/web";
    case "ios": return "/build/ios/iphoneos/Runner.app";
    case "macos": return "/build/macos/Build/Products/Debug/Runner.app";
    case "windows": return "/build/windows/runner/Debug/Runner.exe";
    case "linux": return "/build/linux/x64/release/bundle/Runner";
    default: return "/build/output";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Singleton runtime state — stored on globalThis to survive module re-evaluations. */
const GLOBAL_KEY = "__flutterRuntimeState__";

function getRuntimeState(): RuntimeState {
  if (typeof globalThis !== "undefined" && (globalThis as any)[GLOBAL_KEY]) {
    return (globalThis as any)[GLOBAL_KEY];
  }
  const state = new RuntimeState();
  // Initialize with a welcome log.
  state.log("info", "flutter", `Flutter ${state.sdk.version} (Dart ${state.sdk.dartVersion}) ready.`);
  state.log("info", "runtime", `${state.listBootedDevices().length} device(s) booted.`);
  if (typeof globalThis !== "undefined") {
    (globalThis as any)[GLOBAL_KEY] = state;
  }
  return state;
}

export const runtimeState = getRuntimeState();
