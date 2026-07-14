/** Flutter Runtime types */
export type FlutterChannel = "stable" | "beta" | "main";
export interface SdkInfo { version: string; channel: FlutterChannel; dartVersion: string; path: string; isCurrent: boolean; isValid: boolean; }
export interface EnvironmentInfo { os: string; arch: string; java?: { version: string }; gradle?: { version: string }; androidSdk?: { path: string; version: string }; adb?: { path: string; version: string }; chrome?: { path: string; version: string }; git?: { version: string }; pathEntries: string[]; environmentVariables: Record<string, string>; }
export type DoctorStatus = "pass" | "warning" | "error";
export interface DoctorCheck { id: string; label: string; status: DoctorStatus; message: string; recommendation?: string; }
export interface DoctorResult { checks: DoctorCheck[]; overall: DoctorStatus; summary: string; }
export interface RuntimeProject { id: string; name: string; path: string; flutterVersion: string; dartVersion: string; platforms: string[]; lastOpenedAt: string; createdAt: string; isOpen: boolean; }
export type PubCommand = "get" | "upgrade" | "downgrade" | "outdated" | "deps" | "cache-repair";
export interface PubResult { command: PubCommand; success: boolean; output: string; durationMs: number; packagesAffected: number; }
export type AnalyzeSeverity = "info" | "warning" | "error";
export interface AnalyzeDiagnostic { id: string; severity: AnalyzeSeverity; code: string; message: string; file: string; line: number; column: number; quickFix?: string; }
export interface AnalyzeResult { diagnostics: AnalyzeDiagnostic[]; errorCount: number; warningCount: number; infoCount: number; success: boolean; durationMs: number; }
export type BuildMode = "debug" | "profile" | "release";
export type BuildTarget = "apk" | "aab" | "web" | "windows" | "linux" | "macos" | "ios";
export interface BuildConfig { target: BuildTarget; mode: BuildMode; flavor?: string; args: string[]; }
export interface BuildJob { id: string; config: BuildConfig; status: "queued" | "running" | "success" | "failed" | "cancelled"; progress: number; startedAt?: string; finishedAt?: string; durationMs?: number; artifactPath?: string; logs: string[]; error?: string; }
export interface RunConfig { deviceId: string; target?: string; flavor?: string; args: string[]; environment: Record<string, string>; }
export interface RunSession { id: string; projectId: string; config: RunConfig; status: "starting" | "running" | "paused" | "stopped" | "error"; deviceId: string; startedAt: string; pid?: number; logs: string[]; hotReloadCount: number; hotRestartCount: number; }
export interface HotReloadResult { success: boolean; durationMs: number; message: string; }
export type TestType = "unit" | "widget" | "integration" | "golden";
export interface TestResult { type: TestType; passed: number; failed: number; skipped: number; coverage: number; durationMs: number; output: string; success: boolean; }
export type DevicePlatform = "android" | "ios" | "web" | "windows" | "linux" | "macos";
export interface DeviceInfo { id: string; name: string; platform: DevicePlatform; isEmulator: boolean; isPhysical: boolean; isWireless: boolean; architecture?: string; resolution?: string; batteryLevel?: number; capabilities: string[]; isBooted: boolean; }
export interface EmulatorInfo { id: string; name: string; platform: DevicePlatform; isRunning: boolean; hasSnapshot: boolean; }
export interface ProcessInfo { pid: number; name: string; status: "running" | "paused" | "terminated"; cpu: number; memory: number; startedAt: string; durationMs: number; }
export type LogLevel = "debug" | "info" | "warning" | "error" | "fatal";
export interface LogEntry { id: string; level: LogLevel; source: "flutter" | "dart" | "gradle" | "adb" | "build" | "runtime" | "test"; message: string; timestamp: string; pid?: number; }
export interface TerminalCommand { id: string; command: string; args: string[]; workingDirectory: string; environment: Record<string, string>; timeout: number; }
export interface TerminalResult { commandId: string; stdout: string; stderr: string; exitCode: number; durationMs: number; }
export interface RuntimeSession { id: string; projectId: string; status: "active" | "paused" | "stopped"; startedAt: string; flutterVersion: string; deviceId: string; runSession?: RunSession; buildJobs: BuildJob[]; logCount: number; }
export type HistoryAction = "create" | "open" | "build" | "run" | "test" | "analyze" | "pub" | "hotreload" | "hotrestart";
export interface RuntimeHistoryEntry { id: string; action: HistoryAction; projectId?: string; projectName?: string; success: boolean; durationMs: number; timestamp: string; details?: string; }
export interface RuntimeMetrics { runCount: number; buildCount: number; analyzeCount: number; testCount: number; pubCount: number; averageBuildTimeMs: number; averageStartupTimeMs: number; crashCount: number; hotReloadCount: number; averageHotReloadDurationMs: number; }
