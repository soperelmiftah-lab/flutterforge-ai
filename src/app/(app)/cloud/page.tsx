"use client";

import * as React from "react";
import {
  Cloud, Cpu, ListChecks, Package, Smartphone, FolderArchive,
  Activity, Terminal, Layers, BarChart3, Play, Loader2, Plus, X,
  Trash2, RefreshCw, Power, History, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCloudStore } from "@/stores";
import type { RuntimeType, BuildTarget, BuildMode, JobType } from "@/features/cloud/types";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Cloud Dashboard", icon: Cloud },
  { id: "workers", label: "Workers", icon: Cpu },
  { id: "jobs", label: "Job Queue", icon: ListChecks },
  { id: "builds", label: "Build Farm", icon: Package },
  { id: "devices", label: "Device Farm", icon: Smartphone },
  { id: "artifacts", label: "Artifacts", icon: FolderArchive },
  { id: "monitoring", label: "Monitoring", icon: Activity },
  { id: "logs", label: "Cloud Logs", icon: Terminal },
  { id: "adapters", label: "Runtime Adapters", icon: Layers },
  { id: "history", label: "History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CloudPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const hydrate = useCloudStore((s) => s.hydrate);

  React.useEffect(() => { void hydrate(); }, [hydrate]);

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
        {active === "workers" && <WorkersPanel />}
        {active === "jobs" && <JobsPanel />}
        {active === "builds" && <BuildFarmPanel />}
        {active === "devices" && <DeviceFarmPanel />}
        {active === "artifacts" && <ArtifactsPanel />}
        {active === "monitoring" && <MonitoringPanel />}
        {active === "logs" && <LogsPanel />}
        {active === "adapters" && <AdaptersPanel />}
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

function statusColor(status: string): string {
  switch (status) {
    case "success": case "completed": case "idle": case "available": return "text-emerald-600 dark:text-emerald-400";
    case "running": case "busy": case "reserved": case "queued": return "text-sky-600 dark:text-sky-400";
    case "failed": case "error": case "offline": return "text-rose-600 dark:text-rose-400";
    case "cancelled": case "timeout": return "text-amber-600 dark:text-amber-400";
    default: return "text-muted-foreground";
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { workers, monitoring, metrics, completedJobs, artifacts } = useCloudStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">☁️</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cloud Development Platform</h2>
          <p className="text-xs text-muted-foreground">Real in-memory cloud — workers persist, jobs queue + execute, builds produce artifacts, devices reserve, cost accumulates.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Workers" value={workers.length} />
        <Metric label="Active Workers" value={monitoring?.activeWorkers ?? 0} />
        <Metric label="Completed Jobs" value={monitoring?.completedJobs ?? 0} />
        <Metric label="Artifacts" value={artifacts.length} />
      </div>
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Success Rate" value={`${(metrics.successRate * 100).toFixed(0)}%`} />
          <Metric label="Avg Duration" value={`${metrics.averageDurationMs}ms`} />
          <Metric label="Worker Utilization" value={`${(metrics.workerUtilization * 100).toFixed(0)}%`} />
          <Metric label="Est. Cost" value={`$${metrics.estimatedCostUsd.toFixed(2)}`} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tabs.slice(1).map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => onNavigate(t.id)}
              className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
              <span className="text-xs font-medium text-foreground">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Workers ────────────────────────────────────────────────────────────

function WorkersPanel() {
  const { workers, refreshWorkers, toggleWorker, removeWorker } = useCloudStore();
  const [showAdd, setShowAdd] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<RuntimeType>("docker");

  const handleAdd = async () => {
    if (!name.trim()) return;
    await useCloudStore.getState().addWorker({ name, type, capabilities: ["build", "test"] });
    setName("");
    setShowAdd(false);
    toast.success(`Worker "${name}" added`);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Workers ({workers.length})</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshWorkers()}>
            <RefreshCw className="mr-1 h-3 w-3" />Refresh
          </Button>
          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => setShowAdd(!showAdd)}>
            <Plus className="mr-1 h-3 w-3" />Add
          </Button>
        </div>
      </div>

      {showAdd && (
        <Card><CardContent className="p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Worker name" className="flex-1 rounded border border-border bg-card p-2 text-xs" />
            <Select value={type} onValueChange={(v) => setType(v as RuntimeType)}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="docker">Docker</SelectItem>
                <SelectItem value="remote">Remote</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="ci">CI</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleAdd} disabled={!name.trim()}>Add</Button>
          </div>
        </CardContent></Card>
      )}

      {workers.map((w) => (
        <Card key={w.id}>
          <CardContent className="p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] capitalize">{w.type}</Badge>
              <span className="text-sm font-medium text-foreground">{w.name}</span>
              <Badge variant="outline" className={cn("text-[9px] capitalize", statusColor(w.status))}>{w.status}</Badge>
              <span className="text-[10px] text-muted-foreground">{w.activeJobs}/{w.maxJobs} jobs</span>
              <div className="ml-auto flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void toggleWorker(w.id)}>
                  <Power className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void removeWorker(w.id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 text-[10px] text-muted-foreground sm:grid-cols-4">
              <div>CPU: <span className="text-foreground">{w.cpuUsage.toFixed(0)}%</span></div>
              <div>Memory: <span className="text-foreground">{w.memoryUsage.toFixed(0)}%</span></div>
              <div>Address: <span className="text-foreground">{w.address ?? "—"}</span></div>
              <div>Heartbeat: <span className="text-foreground">{new Date(w.lastHeartbeat).toLocaleTimeString()}</span></div>
            </div>
            <div className="mt-1 flex flex-wrap gap-1">
              {w.capabilities.map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Job Queue ──────────────────────────────────────────────────────────

function JobsPanel() {
  const { jobQueue, completedJobs, enqueueJob, cancelJob, refreshJobs } = useCloudStore();
  const [jobType, setJobType] = React.useState<JobType>("build");
  const [runtimeType, setRuntimeType] = React.useState<RuntimeType>("local");

  const handleSubmit = async () => {
    const cmd: Record<JobType, { command: string; args: string[] }> = {
      build: { command: "flutter", args: ["build", "apk"] },
      run: { command: "flutter", args: ["run", "-d", "chrome"] },
      test: { command: "flutter", args: ["test"] },
      analyze: { command: "flutter", args: ["analyze"] },
      pub: { command: "flutter", args: ["pub", "get"] },
      custom: { command: "echo", args: ["hello"] },
    };
    const c = cmd[jobType];
    const job = await enqueueJob({ type: jobType, command: c.command, args: c.args, runtimeType });
    if (job) toast.success(`Job enqueued: ${job.id}`);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Job Queue ({jobQueue.length} queued, {completedJobs.length} completed)</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshJobs()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>

      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Submit Job</h4>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="build">Build</SelectItem>
              <SelectItem value="run">Run</SelectItem>
              <SelectItem value="test">Test</SelectItem>
              <SelectItem value="analyze">Analyze</SelectItem>
              <SelectItem value="pub">Pub</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          <Select value={runtimeType} onValueChange={(v) => setRuntimeType(v as RuntimeType)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="local">Local</SelectItem>
              <SelectItem value="docker">Docker</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="cloud">Cloud</SelectItem>
              <SelectItem value="ci">CI</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleSubmit}>
            <Play className="mr-1 h-3 w-3" />Submit
          </Button>
        </div>
      </CardContent></Card>

      {jobQueue.length > 0 && (
        <div>
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Queue</h4>
          <div className="space-y-1.5">
            {jobQueue.map((j) => (
              <div key={j.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
                <Badge variant="outline" className={cn("text-[9px] capitalize", statusColor(j.status))}>{j.status}</Badge>
                <Badge variant="outline" className="text-[9px]">{j.type}</Badge>
                <span className="font-mono text-foreground">{j.command} {j.args.join(" ")}</span>
                <Badge variant="outline" className="text-[9px]">{j.runtimeType}</Badge>
                {j.workerId && <span className="text-[10px] text-muted-foreground">→ {j.workerId}</span>}
                {j.status === "queued" && (
                  <Button size="sm" variant="ghost" className="ml-auto h-6 px-2 text-xs" onClick={() => void cancelJob(j.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {completedJobs.length > 0 && (
        <div>
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Completed ({completedJobs.length})</h4>
          <div className="max-h-96 space-y-1.5 overflow-y-auto ff-scroll">
            {completedJobs.slice(0, 20).map((j) => (
              <div key={j.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", statusColor(j.status))}>{j.status}</Badge>
                  <Badge variant="outline" className="text-[9px]">{j.type}</Badge>
                  <span className="font-mono text-foreground">{j.command} {j.args.join(" ")}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{j.durationMs}ms</span>
                </div>
                {j.stdout.length > 0 && <pre className="ff-scroll mt-1 max-h-20 overflow-auto rounded bg-muted/30 p-1 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">{j.stdout.join("\n")}</pre>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Build Farm ─────────────────────────────────────────────────────────

function BuildFarmPanel() {
  const { builds, queueBuild, refreshBuilds } = useCloudStore();
  const [target, setTarget] = React.useState<BuildTarget>("apk");
  const [mode, setMode] = React.useState<BuildMode>("debug");

  const handleBuild = async () => {
    toast.info(`Queuing ${target}/${mode} build…`);
    const build = await queueBuild(target, mode);
    if (build) toast.success(`Build queued: ${build.id}`);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Build Farm ({builds.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshBuilds()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <Card><CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={target} onValueChange={(v) => setTarget(v as BuildTarget)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="apk">APK</SelectItem>
              <SelectItem value="aab">AAB</SelectItem>
              <SelectItem value="web">Web</SelectItem>
              <SelectItem value="linux">Linux</SelectItem>
            </SelectContent>
          </Select>
          <Select value={mode} onValueChange={(v) => setMode(v as BuildMode)}>
            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="debug">Debug</SelectItem>
              <SelectItem value="profile">Profile</SelectItem>
              <SelectItem value="release">Release</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" onClick={handleBuild}>
            <Package className="mr-1 h-3 w-3" />Build
          </Button>
        </div>
      </CardContent></Card>
      {builds.length === 0 ? (
        <EmptyState icon={Package} title="No builds" description="Click Build to queue a build farm job." />
      ) : (
        <div className="space-y-1.5">
          {builds.map((b) => (
            <div key={b.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              <Badge variant="outline" className={cn("text-[9px] capitalize", statusColor(b.status))}>{b.status}</Badge>
              <span className="text-foreground">{b.target}/{b.mode}</span>
              {b.durationMs !== undefined && <span className="text-[10px] text-muted-foreground">{b.durationMs}ms</span>}
              <span className="ml-auto text-[10px] text-muted-foreground">{new Date(b.enqueuedAt).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Device Farm ────────────────────────────────────────────────────────

function DeviceFarmPanel() {
  const { devices, reserveDevice, releaseDevice, refreshDevices } = useCloudStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Device Farm ({devices.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshDevices()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      {devices.map((d) => (
        <Card key={d.id}>
          <CardContent className="p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px]">{d.type}</Badge>
              <span className="text-sm font-medium text-foreground">{d.name}</span>
              <Badge variant="outline" className={cn("text-[9px] capitalize", statusColor(d.status))}>{d.status}</Badge>
              {d.reservedBy && <span className="text-[10px] text-muted-foreground">by {d.reservedBy}</span>}
              <div className="ml-auto">
                {d.status === "available" ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void reserveDevice(d.id)}>Reserve</Button>
                ) : d.status === "reserved" ? (
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void releaseDevice(d.id)}>Release</Button>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {d.capabilities.map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Artifacts ──────────────────────────────────────────────────────────

function ArtifactsPanel() {
  const { artifacts, deleteArtifact, refreshArtifacts } = useCloudStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Artifacts ({artifacts.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshArtifacts()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      {artifacts.length === 0 ? (
        <EmptyState icon={FolderArchive} title="No artifacts" description="Run a build to produce artifacts." />
      ) : (
        <div className="space-y-1.5">
          {artifacts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              <Badge variant="outline" className="text-[9px] uppercase">{a.type}</Badge>
              <span className="font-mono text-foreground">{a.name}</span>
              <span className="text-[10px] text-muted-foreground">{a.sizeMb}MB</span>
              {a.signed && <Badge variant="outline" className="text-[9px] text-emerald-600">signed</Badge>}
              <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString()}</span>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => void deleteArtifact(a.id)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Monitoring ─────────────────────────────────────────────────────────

function MonitoringPanel() {
  const { monitoring, refreshMetrics } = useCloudStore();
  React.useEffect(() => { void refreshMetrics(); }, [refreshMetrics]);
  if (!monitoring) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Monitoring</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Workers" value={monitoring.totalWorkers} />
        <Metric label="Active Workers" value={monitoring.activeWorkers} />
        <Metric label="Queued Jobs" value={monitoring.queuedJobs} />
        <Metric label="Running Jobs" value={monitoring.runningJobs} />
        <Metric label="Completed" value={monitoring.completedJobs} />
        <Metric label="Failed" value={<span className={monitoring.failedJobs > 0 ? "text-rose-600" : ""}>{monitoring.failedJobs}</span>} />
        <Metric label="Avg CPU" value={`${monitoring.averageCpu}%`} />
        <Metric label="Avg Memory" value={`${monitoring.averageMemory}%`} />
        <Metric label="Success Rate" value={`${(monitoring.successRate * 100).toFixed(0)}%`} />
        <Metric label="Avg Duration" value={`${monitoring.averageDurationMs}ms`} />
      </div>
    </div>
  );
}

// ─── Logs ───────────────────────────────────────────────────────────────

function LogsPanel() {
  const { logs, clearLogs, refreshLogs } = useCloudStore();
  const colors: Record<string, string> = { info: "text-sky-600", warning: "text-amber-600", error: "text-rose-600" };
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
        <span className="text-xs text-muted-foreground">{logs.length} logs</span>
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
              <span className={cn("shrink-0 uppercase font-medium", colors[l.level])}>{l.level}</span>
              <span className="text-foreground">{l.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Adapters ───────────────────────────────────────────────────────────

function AdaptersPanel() {
  const { adapters, refreshAdapters } = useCloudStore();
  React.useEffect(() => { void refreshAdapters(); }, [refreshAdapters]);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Runtime Adapters ({adapters.length})</h3>
      {adapters.map((a) => (
        <Card key={a.type}>
          <CardContent className="p-3">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] capitalize">{a.type}</Badge>
              <span className="text-sm font-medium text-foreground">{a.name}</span>
              {a.available ? (
                <Badge variant="outline" className="text-[9px] text-emerald-600">available</Badge>
              ) : (
                <Badge variant="outline" className="text-[9px] text-muted-foreground">unavailable</Badge>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {a.capabilities.map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}
            </div>
            <div className="mt-1 text-[10px] text-muted-foreground">{JSON.stringify(a.config)}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const { history, refreshHistory } = useCloudStore();
  React.useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">History ({history.length})</h3>
      {history.length === 0 ? (
        <EmptyState icon={History} title="No history" description="Submit jobs to see history." />
      ) : (
        <div className="space-y-1.5">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              <Badge variant="outline" className="text-[9px]">{h.type}</Badge>
              <Badge variant="outline" className="text-[9px]">{h.runtimeType}</Badge>
              {h.success ? <span className="text-emerald-600">✓</span> : <span className="text-rose-600">✗</span>}
              {h.workerName && <span className="text-muted-foreground">{h.workerName}</span>}
              <span className="ml-auto text-[10px] text-muted-foreground">{h.durationMs}ms · {new Date(h.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { metrics, refreshMetrics } = useCloudStore();
  React.useEffect(() => { void refreshMetrics(); }, [refreshMetrics]);
  if (!metrics) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Cloud Metrics</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshMetrics()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Jobs" value={metrics.totalJobs} />
        <Metric label="Total Builds" value={metrics.totalBuilds} />
        <Metric label="Success Rate" value={`${(metrics.successRate * 100).toFixed(0)}%`} />
        <Metric label="Avg Duration" value={`${metrics.averageDurationMs}ms`} />
        <Metric label="Worker Utilization" value={`${(metrics.workerUtilization * 100).toFixed(0)}%`} />
        <Metric label="Artifacts" value={metrics.totalArtifacts} />
        <Metric label="Cache Hit Rate" value={`${(metrics.cacheHitRate * 100).toFixed(0)}%`} />
        <Metric label="Est. Cost" value={`$${metrics.estimatedCostUsd.toFixed(2)}`} />
      </div>
      {metrics.jobsByType.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Jobs by Type</h4>
          <div className="space-y-1">
            {metrics.jobsByType.map((j) => (
              <div key={j.type} className="flex items-center gap-2 text-xs">
                <span className="flex-1 capitalize text-foreground">{j.type}</span>
                <span className="text-[10px] text-muted-foreground">{j.count}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {metrics.jobsByRuntime.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Jobs by Runtime</h4>
          <div className="space-y-1">
            {metrics.jobsByRuntime.map((j) => (
              <div key={j.runtime} className="flex items-center gap-2 text-xs">
                <span className="flex-1 capitalize text-foreground">{j.runtime}</span>
                <span className="text-[10px] text-muted-foreground">{j.count}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
