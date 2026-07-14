"use client";

import * as React from "react";
import {
  Terminal as TerminalIcon, Cpu, Monitor, Smartphone, Activity, History,
  BarChart3, Stethoscope, Package, Layers, Zap, Play, Loader2, Square,
  RefreshCw, Flame, FlameKindling, Trash2, Power, Plug, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRuntimeStore } from "@/stores";
import type {
  LogLevel, BuildTarget, BuildMode, DeviceInfo, TestType, PubCommand,
} from "@/features/flutter-runtime/types";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Runtime Dashboard", icon: TerminalIcon },
  { id: "run", label: "Run Center", icon: Play },
  { id: "build", label: "Build Center", icon: Package },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "emulators", label: "Emulators", icon: Monitor },
  { id: "analyze", label: "Analyze", icon: Activity },
  { id: "test", label: "Test", icon: Layers },
  { id: "pub", label: "Pub", icon: Package },
  { id: "doctor", label: "Flutter Doctor", icon: Stethoscope },
  { id: "logs", label: "Log Viewer", icon: TerminalIcon },
  { id: "processes", label: "Processes", icon: Cpu },
  { id: "history", label: "History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function RuntimePage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const hydrate = useRuntimeStore((s) => s.hydrate);

  React.useEffect(() => { void hydrate(); }, [hydrate]);

  // Poll logs every 3s for live updates.
  const refreshLogs = useRuntimeStore((s) => s.refreshLogs);
  React.useEffect(() => {
    const id = setInterval(() => void refreshLogs(), 3000);
    return () => clearInterval(id);
  }, [refreshLogs]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-muted/20 px-2 ff-scroll">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                active === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-3.5 w-3.5" />{t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "run" && <RunPanel />}
        {active === "build" && <BuildPanel />}
        {active === "devices" && <DevicesPanel />}
        {active === "emulators" && <EmulatorsPanel />}
        {active === "analyze" && <AnalyzePanel />}
        {active === "test" && <TestPanel />}
        {active === "pub" && <PubPanel />}
        {active === "doctor" && <DoctorPanel />}
        {active === "logs" && <LogsPanel />}
        {active === "processes" && <ProcessesPanel />}
        {active === "history" && <HistoryPanel />}
        {active === "metrics" && <MetricsPanel />}
      </div>
    </div>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────

function Metric({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (<div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}><div className="text-lg font-semibold text-foreground">{value}</div><div className="text-[10px] text-muted-foreground">{label}</div></div>);
}

function EmptyState({ icon, title, description }: { icon?: LucideIcon; title: string; description?: string }) {
  const Icon = icon;
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {Icon && <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Icon className="h-5 w-5" /></div>}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function levelColor(l: LogLevel): string {
  switch (l) {
    case "debug": return "text-muted-foreground";
    case "info": return "text-sky-600 dark:text-sky-400";
    case "warning": return "text-amber-600 dark:text-amber-400";
    case "error": return "text-rose-600 dark:text-rose-400";
    case "fatal": return "text-rose-700 dark:text-rose-300 font-bold";
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { sdk, devices, metrics, activeSession, buildJobs, sessions } = useRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">⚡</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Flutter Runtime Platform</h2>
          <p className="text-xs text-muted-foreground">Real in-memory runtime — sessions persist, logs accumulate, builds progress, hot reload updates counters.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Flutter SDK" value={sdk?.version ?? "—"} />
        <Metric label="Dart Version" value={sdk?.dartVersion ?? "—"} />
        <Metric label="Devices" value={devices.length} />
        <Metric label="Active Session" value={activeSession ? <span className="text-emerald-600">Running</span> : "—"} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Runs" value={metrics?.runCount ?? 0} />
        <Metric label="Builds" value={metrics?.buildCount ?? 0} />
        <Metric label="Hot Reloads" value={metrics?.hotReloadCount ?? 0} />
        <Metric label="Avg Build" value={metrics?.averageBuildTimeMs ? `${(metrics.averageBuildTimeMs / 1000).toFixed(1)}s` : "—"} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tabs.slice(1).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onNavigate(t.id)} className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-foreground">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Run Center ─────────────────────────────────────────────────────────

function RunPanel() {
  const { devices, activeSession, sessions, running, startRun, stopSession, hotReload, hotRestart } = useRuntimeStore();
  const [deviceId, setDeviceId] = React.useState<string>("");

  React.useEffect(() => {
    if (!deviceId && devices.length > 0) {
      const booted = devices.find((d) => d.isBooted);
      if (booted) setDeviceId(booted.id);
    }
  }, [devices, deviceId]);

  const bootedDevices = devices.filter((d) => d.isBooted);

  const handleRun = async () => {
    if (!deviceId) {
      toast.error("Select a device first");
      return;
    }
    toast.info(`Starting app on ${deviceId}…`);
    const session = await startRun(deviceId);
    if (session) {
      toast.success(`App running on ${deviceId}`);
    } else {
      toast.error("Run failed");
    }
  };

  const handleHotReload = async () => {
    const r = await hotReload();
    if (r?.success) toast.success(r.message);
    else toast.error("Hot reload failed");
  };

  const handleHotRestart = async () => {
    const r = await hotRestart();
    if (r?.success) toast.success(r.message);
    else toast.error("Hot restart failed");
  };

  const handleStop = async () => {
    if (!activeSession) return;
    await stopSession(activeSession.id);
    toast.success("Session stopped");
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Start Run Session</h4>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={deviceId} onValueChange={setDeviceId}>
              <SelectTrigger className="w-full sm:w-64"><SelectValue placeholder="Select device…" /></SelectTrigger>
              <SelectContent>
                {bootedDevices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name} ({d.platform})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleRun} disabled={running || !deviceId || !!activeSession}>
              {running ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
              Run
            </Button>
            {activeSession && (
              <Button variant="outline" onClick={handleStop}>
                <Square className="mr-1 h-3.5 w-3.5" />Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {activeSession && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Active Session</h4>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleHotReload}>
                  <Flame className="mr-1 h-3 w-3" />Hot Reload
                </Button>
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleHotRestart}>
                  <FlameKindling className="mr-1 h-3 w-3" />Hot Restart
                </Button>
              </div>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Status" value={<span className="text-emerald-600 capitalize">{activeSession.status}</span>} />
              <Metric label="PID" value={activeSession.pid ?? "—"} />
              <Metric label="Device" value={activeSession.deviceId} />
              <Metric label="Hot Reloads" value={activeSession.hotReloadCount} />
            </div>
            <pre className="ff-scroll max-h-60 overflow-auto rounded bg-muted/30 p-3 text-[10px] font-mono text-foreground whitespace-pre-wrap">{activeSession.logs.join("\n")}</pre>
          </CardContent>
        </Card>
      )}

      {sessions.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">All Sessions ({sessions.length})</h4>
            <div className="space-y-1.5">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", s.status === "running" ? "text-emerald-600" : "text-muted-foreground")}>{s.status}</Badge>
                  <span className="font-mono text-foreground">{s.id}</span>
                  <span className="text-muted-foreground">{s.deviceId}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">🔥 {s.hotReloadCount} · 🔥🔥 {s.hotRestartCount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {!activeSession && sessions.length === 0 && (
        <EmptyState icon={Play} title="No active session" description="Select a device and click Run to start a Flutter app session." />
      )}
    </div>
  );
}

// ─── Build Center ───────────────────────────────────────────────────────

function BuildPanel() {
  const { buildJobs, building, startBuild } = useRuntimeStore();
  const [target, setTarget] = React.useState<BuildTarget>("apk");
  const [mode, setMode] = React.useState<BuildMode>("debug");

  const handleBuild = async () => {
    toast.info(`Building ${target}/${mode}…`);
    const job = await startBuild(target, mode);
    if (job?.status === "success") {
      toast.success(`Build succeeded in ${(job.durationMs! / 1000).toFixed(1)}s`);
    } else {
      toast.error("Build failed");
    }
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Build</h4>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={target} onValueChange={(v) => setTarget(v as BuildTarget)}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="apk">APK (Android)</SelectItem>
                <SelectItem value="aab">AAB (Android)</SelectItem>
                <SelectItem value="web">Web</SelectItem>
                <SelectItem value="ios">iOS</SelectItem>
                <SelectItem value="macos">macOS</SelectItem>
                <SelectItem value="windows">Windows</SelectItem>
                <SelectItem value="linux">Linux</SelectItem>
              </SelectContent>
            </Select>
            <Select value={mode} onValueChange={(v) => setMode(v as BuildMode)}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="debug">Debug</SelectItem>
                <SelectItem value="profile">Profile</SelectItem>
                <SelectItem value="release">Release</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleBuild} disabled={building}>
              {building ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Package className="mr-1 h-3.5 w-3.5" />}
              Build
            </Button>
          </div>
        </CardContent>
      </Card>

      {buildJobs.length === 0 ? (
        <EmptyState icon={Package} title="No builds yet" description="Click Build to start a build job." />
      ) : (
        <div className="space-y-2">
          {buildJobs.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-3">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", job.status === "success" ? "text-emerald-600" : job.status === "failed" ? "text-rose-600" : "text-sky-600")}>{job.status}</Badge>
                  <span className="text-xs font-medium text-foreground">{job.config.target}/{job.config.mode}</span>
                  {job.durationMs !== undefined && (
                    <span className="text-[10px] text-muted-foreground">{(job.durationMs / 1000).toFixed(1)}s</span>
                  )}
                  {job.artifactPath && (
                    <span className="ml-auto truncate text-[10px] font-mono text-muted-foreground">{job.artifactPath}</span>
                  )}
                </div>
                <pre className="ff-scroll max-h-32 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{job.logs.join("\n")}</pre>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Devices Panel ──────────────────────────────────────────────────────

function DevicesPanel() {
  const { devices, detachDevice } = useRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Connected Devices ({devices.length})</h3>
      {devices.length === 0 ? (
        <EmptyState icon={Smartphone} title="No devices" description="Attach a device or start an emulator." />
      ) : (
        devices.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-3">
              <div className="mb-1 flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                <Badge variant="outline" className="text-[9px] capitalize">{d.platform}</Badge>
                {d.isBooted && <Badge variant="outline" className="text-[9px] text-emerald-600">booted</Badge>}
                {d.isEmulator && <Badge variant="outline" className="text-[9px]">emulator</Badge>}
                {d.isPhysical && <Badge variant="outline" className="text-[9px] text-sky-600">physical</Badge>}
                <Button size="sm" variant="ghost" className="ml-auto h-7 px-2 text-xs" onClick={() => void detachDevice(d.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[10px] text-muted-foreground">
                {d.resolution ?? "—"} · {d.architecture ?? "—"}
                {d.batteryLevel !== undefined && ` · ${d.batteryLevel}% battery`}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {d.capabilities.map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Emulators Panel ────────────────────────────────────────────────────

function EmulatorsPanel() {
  const { emulators, startEmulator, stopEmulator } = useRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Emulators ({emulators.length})</h3>
      {emulators.map((e) => (
        <Card key={e.id}>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{e.name}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{e.platform}</Badge>
              {e.isRunning ? (
                <Badge variant="outline" className="text-[9px] text-emerald-600">running</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px]">stopped</Badge>
              )}
              {e.hasSnapshot && <Badge variant="outline" className="text-[9px]">snapshot</Badge>}
              <div className="ml-auto">
                {e.isRunning ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void stopEmulator(e.id)}>
                    <Power className="mr-1 h-3 w-3" />Stop
                  </Button>
                ) : (
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => void startEmulator(e.id)}>
                    <Play className="mr-1 h-3 w-3" />Start
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Analyze Panel ──────────────────────────────────────────────────────

function AnalyzePanel() {
  const { runAnalyze } = useRuntimeStore();
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const analyze = async () => {
    setLoading(true);
    toast.info("Running flutter analyze…");
    const r = await runAnalyze();
    if (r) {
      setResult(r);
      toast.success(`Analyze complete: ${r.errorCount} errors, ${r.warningCount} warnings`);
    } else {
      toast.error("Analyze failed");
    }
    setLoading(false);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Code Analysis</h3>
        <Button size="sm" onClick={analyze} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1 h-3.5 w-3.5" />}
          Analyze
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Runs <code className="font-mono">flutter analyze</code> against Dart files in the VFS.</p>
      {result && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Errors" value={<span className={result.errorCount > 0 ? "text-rose-600" : ""}>{result.errorCount}</span>} />
            <Metric label="Warnings" value={<span className={result.warningCount > 0 ? "text-amber-600" : ""}>{result.warningCount}</span>} />
            <Metric label="Info" value={<span className="text-sky-600">{result.infoCount}</span>} />
          </div>
          {result.diagnostics.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Diagnostics ({result.diagnostics.length})</h4>
                <div className="max-h-96 space-y-1.5 overflow-y-auto ff-scroll">
                  {result.diagnostics.map((d: any) => (
                    <div key={d.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                      <div className="mb-0.5 flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-[9px] capitalize", d.severity === "error" ? "text-rose-600" : d.severity === "warning" ? "text-amber-600" : "text-sky-600")}>{d.severity}</Badge>
                        <Badge variant="outline" className="text-[9px] font-mono">{d.code}</Badge>
                        <span className="font-mono text-[10px] text-muted-foreground">{d.file}:{d.line}:{d.column}</span>
                      </div>
                      <p className="text-foreground">{d.message}</p>
                      {d.quickFix && <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">→ {d.quickFix}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Test Panel ─────────────────────────────────────────────────────────

function TestPanel() {
  const { runTest } = useRuntimeStore();
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [type, setType] = React.useState<TestType>("unit");

  const handleRun = async () => {
    setLoading(true);
    toast.info(`Running ${type} tests…`);
    const r = await runTest(type);
    if (r) {
      setResult(r);
      toast.success(r.success ? `${r.passed} tests passed` : `${r.failed} tests failed`);
    } else {
      toast.error("Test failed");
    }
    setLoading(false);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Test Runner</h3>
        <div className="flex items-center gap-2">
          <Select value={type} onValueChange={(v) => setType(v as TestType)}>
            <SelectTrigger className="h-7 w-32 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unit">Unit</SelectItem>
              <SelectItem value="widget">Widget</SelectItem>
              <SelectItem value="integration">Integration</SelectItem>
              <SelectItem value="golden">Golden</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleRun} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1 h-3.5 w-3.5" />}
            Run
          </Button>
        </div>
      </div>
      {result && (
        <>
          <div className="grid grid-cols-4 gap-3">
            <Metric label="Passed" value={<span className="text-emerald-600">{result.passed}</span>} />
            <Metric label="Failed" value={<span className={result.failed > 0 ? "text-rose-600" : ""}>{result.failed}</span>} />
            <Metric label="Skipped" value={result.skipped} />
            <Metric label="Coverage" value={`${result.coverage}%`} />
          </div>
          <Card>
            <CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Output</h4>
              <pre className="ff-scroll max-h-60 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{result.output}</pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Pub Panel ──────────────────────────────────────────────────────────

function PubPanel() {
  const { runPub } = useRuntimeStore();
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [command, setCommand] = React.useState<PubCommand>("get");

  const handleRun = async () => {
    setLoading(true);
    toast.info(`Running flutter pub ${command}…`);
    const r = await runPub(command);
    if (r) {
      setResult(r);
      toast.success(`pub ${command} complete`);
    } else {
      toast.error("pub failed");
    }
    setLoading(false);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pub Commands</h3>
        <div className="flex items-center gap-2">
          <Select value={command} onValueChange={(v) => setCommand(v as PubCommand)}>
            <SelectTrigger className="h-7 w-40 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="get">get</SelectItem>
              <SelectItem value="upgrade">upgrade</SelectItem>
              <SelectItem value="downgrade">downgrade</SelectItem>
              <SelectItem value="outdated">outdated</SelectItem>
              <SelectItem value="deps">deps</SelectItem>
              <SelectItem value="cache-repair">cache-repair</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleRun} disabled={loading}>
            {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Package className="mr-1 h-3.5 w-3.5" />}
            Run
          </Button>
        </div>
      </div>
      {result && (
        <Card>
          <CardContent className="p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">pub {result.command}</Badge>
              <Badge variant="outline" className={cn("text-[9px]", result.success ? "text-emerald-600" : "text-rose-600")}>{result.success ? "success" : "failed"}</Badge>
              <span className="text-[10px] text-muted-foreground">{result.durationMs}ms · {result.packagesAffected} packages</span>
            </div>
            <pre className="ff-scroll max-h-60 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{result.output}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Doctor Panel ───────────────────────────────────────────────────────

function DoctorPanel() {
  const { doctor, runDoctor } = useRuntimeStore();
  React.useEffect(() => { void runDoctor(); }, [runDoctor]);

  if (!doctor) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Flutter Doctor</h3>
        <Badge variant="outline" className={cn("text-[9px] capitalize", doctor.overall === "pass" ? "text-emerald-600" : doctor.overall === "warning" ? "text-amber-600" : "text-rose-600")}>{doctor.overall}</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{doctor.summary}</p>
      {doctor.checks.map((c) => (
        <div key={c.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2.5 text-xs">
          <span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", c.status === "pass" ? "bg-emerald-500" : c.status === "warning" ? "bg-amber-500" : "bg-rose-500")} />
          <div className="flex-1">
            <span className="font-medium text-foreground">{c.label}</span>
            <p className="text-muted-foreground">{c.message}</p>
            {c.recommendation && <p className="text-amber-600 dark:text-amber-400">→ {c.recommendation}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Logs Panel ─────────────────────────────────────────────────────────

function LogsPanel() {
  const { logs, logStats, clearLogs, refreshLogs } = useRuntimeStore();
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
        <div className="flex items-center gap-2 text-[10px]">
          {logStats && Object.entries(logStats).map(([level, count]) => (
            <span key={level} className={cn("font-mono", levelColor(level as LogLevel))}>{level}: {count as number}</span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void refreshLogs()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void clearLogs()}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2 font-mono text-[11px]">
        {logs.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">No logs yet.</p>
        ) : (
          logs.map((l) => (
            <div key={l.id} className="flex items-start gap-2 py-0.5 hover:bg-muted/30">
              <span className="shrink-0 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span>
              <span className={cn("shrink-0 uppercase font-medium", levelColor(l.level))}>{l.level}</span>
              <span className="shrink-0 text-muted-foreground">[{l.source}]</span>
              <span className="text-foreground">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Processes Panel ────────────────────────────────────────────────────

function ProcessesPanel() {
  const { processes, killProcess } = useRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Processes ({processes.length})</h3>
      {processes.length === 0 ? (
        <EmptyState icon={Cpu} title="No processes" description="Start a run session to spawn a process." />
      ) : (
        processes.map((p) => (
          <Card key={p.pid}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="outline" className="text-[9px] capitalize">{p.status}</Badge>
                <span className="font-mono text-foreground">PID {p.pid}</span>
                <span className="text-muted-foreground truncate">{p.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{p.cpu.toFixed(1)}% CPU · {p.memory}MB</span>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void killProcess(p.pid)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── History Panel ──────────────────────────────────────────────────────

function HistoryPanel() {
  const { history } = useRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Runtime History ({history.length})</h3>
      {history.length === 0 ? (
        <EmptyState icon={History} title="No history yet" description="Run a build, run, or analyze to record history." />
      ) : (
        history.map((h) => (
          <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
            <Badge variant="outline" className="text-[9px] capitalize">{h.action}</Badge>
            <span className={h.success ? "text-emerald-600" : "text-rose-600"}>{h.success ? "✓" : "✗"}</span>
            {h.details && <span className="text-muted-foreground truncate">{h.details}</span>}
            <span className="ml-auto text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Metrics Panel ──────────────────────────────────────────────────────

function MetricsPanel() {
  const { metrics, refreshMetrics } = useRuntimeStore();
  if (!metrics) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Runtime Metrics</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshMetrics()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Runs" value={metrics.runCount} />
        <Metric label="Builds" value={metrics.buildCount} />
        <Metric label="Analyzes" value={metrics.analyzeCount} />
        <Metric label="Tests" value={metrics.testCount} />
        <Metric label="Pub Commands" value={metrics.pubCount} />
        <Metric label="Hot Reloads" value={metrics.hotReloadCount} />
        <Metric label="Avg Build Time" value={metrics.averageBuildTimeMs ? `${(metrics.averageBuildTimeMs / 1000).toFixed(1)}s` : "—"} />
        <Metric label="Avg Startup" value={metrics.averageStartupTimeMs ? `${(metrics.averageStartupTimeMs / 1000).toFixed(1)}s` : "—"} />
        <Metric label="Avg Hot Reload" value={metrics.averageHotReloadDurationMs ? `${metrics.averageHotReloadDurationMs}ms` : "—"} />
        <Metric label="Crashes" value={<span className={metrics.crashCount > 0 ? "text-rose-600" : ""}>{metrics.crashCount}</span>} />
      </div>
    </div>
  );
}
