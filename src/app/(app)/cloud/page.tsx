"use client";

import * as React from "react";
import {
  Cloud, Cpu, ListChecks, Package, Smartphone, FolderArchive,
  Activity, Terminal, Layers, BarChart3, Play, Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function CloudPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
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
        {active === "metrics" && <MetricsPanel />}
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
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

function useFetch<T>(url: string): { data: T | null; loading: boolean; refresh: () => void } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [nonce, setNonce] = React.useState(0);
  React.useEffect(() => { setLoading(true); fetch(url).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false)); }, [url, nonce]);
  return { data, loading, refresh: () => setNonce(n => n + 1) };
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { data } = useFetch<any>("/api/v1/cloud/metrics");
  const m = data?.data;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">☁️</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cloud Development Platform</h2>
          <p className="text-xs text-muted-foreground">Distributed execution with interchangeable Runtime Adapters — local, Docker, remote, cloud, and CI.</p>
        </div>
      </div>
      {m && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Workers" value={m.monitoring.totalWorkers} />
          <Metric label="Queued Jobs" value={m.monitoring.queuedJobs} />
          <Metric label="Running" value={m.monitoring.runningJobs} />
          <Metric label="Success Rate" value={`${(m.metrics.successRate * 100).toFixed(0)}%`} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
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
  const { data, loading, refresh } = useFetch<any>("/api/v1/cloud/workers");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const workers = data?.data ?? [];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Workers ({workers.length})</h3><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}>Refresh</Button></div>
      {workers.map((w: any) => (
        <div key={w.id} className={cn("rounded-lg border p-3", w.status === "idle" ? "border-emerald-500/30 bg-emerald-500/5" : w.status === "busy" ? "border-amber-500/30 bg-amber-500/5" : "border-border/60 bg-card")}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">{w.name}</span>
            <Badge variant="outline" className="text-[9px] capitalize">{w.type}</Badge>
            <Badge variant="outline" className={cn("text-[9px] capitalize", w.status === "idle" ? "text-emerald-600" : w.status === "busy" ? "text-amber-600" : "text-muted-foreground")}>{w.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
            <div>CPU: <span className="text-foreground">{w.cpuUsage}%</span></div>
            <div>Memory: <span className="text-foreground">{w.memoryUsage}MB</span></div>
            <div>Jobs: <span className="text-foreground">{w.activeJobs}/{w.maxJobs}</span></div>
            <div>Heartbeat: <span className="text-foreground">{new Date(w.lastHeartbeat).toLocaleTimeString()}</span></div>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">{w.capabilities.map((c: string) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Jobs ───────────────────────────────────────────────────────────────

function JobsPanel() {
  const { data, loading, refresh } = useFetch<any>("/api/v1/cloud/jobs");
  const [submitting, setSubmitting] = React.useState(false);
  const submit = async () => { setSubmitting(true); try { await fetch("/api/v1/cloud/jobs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "analyze", command: "flutter", args: ["analyze"] }) }); toast.success("Job submitted"); refresh(); } catch { toast.error("Submit failed"); } setSubmitting(false); };
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const queue = data?.data?.queue ?? [];
  const completed = data?.data?.completed ?? [];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Job Queue ({queue.length})</h3><div className="flex gap-2"><Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}>Refresh</Button><Button size="sm" className="h-7 text-xs" onClick={submit} disabled={submitting}>{submitting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}Submit Job</Button></div></div>
      {queue.length > 0 && <Card><CardContent className="p-3"><h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Queued + Running</h4>{queue.map((j: any) => <JobRow key={j.id} job={j} />)}</CardContent></Card>}
      {completed.length > 0 && <Card><CardContent className="p-3"><h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Completed ({completed.length})</h4>{completed.map((j: any) => <JobRow key={j.id} job={j} />)}</CardContent></Card>}
    </div>
  );
}

function JobRow({ job }: { job: any }) {
  const statusColors: Record<string, string> = { success: "text-emerald-600", failed: "text-rose-600", running: "text-sky-600", queued: "text-muted-foreground", cancelled: "text-muted-foreground", timeout: "text-amber-600" };
  return (
    <div className="mb-1 flex items-center gap-2 rounded border border-border/60 p-2 text-xs">
      <Badge variant="outline" className="text-[9px] capitalize">{job.type}</Badge>
      <Badge variant="outline" className={cn("text-[9px] capitalize", statusColors[job.status])}>{job.status}</Badge>
      <span className="font-mono text-foreground">{job.command} {job.args.join(" ")}</span>
      <span className="text-[10px] text-muted-foreground capitalize">{job.runtimeType}</span>
      {job.durationMs && <span className="ml-auto text-[10px] text-muted-foreground">{job.durationMs}ms</span>}
    </div>
  );
}

// ─── Build Farm ─────────────────────────────────────────────────────────

function BuildFarmPanel() {
  const [building, setBuilding] = React.useState(false);
  const [target, setTarget] = React.useState("apk");
  const build = async () => { setBuilding(true); try { await fetch("/api/v1/cloud/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, mode: "debug" }) }); toast.success("Build queued"); } catch { toast.error("Build failed"); } setBuilding(false); };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Build Farm</h3>
      <Card><CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <label className="text-xs text-muted-foreground">Target:</label>
          {["apk", "aab", "web"].map(t => <button key={t} onClick={() => setTarget(t)} className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", target === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{t}</button>)}
          <Button size="sm" className="ml-auto h-7 text-xs" onClick={build} disabled={building}>{building ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Package className="mr-1 h-3 w-3" />}Build</Button>
        </div>
        <p className="text-xs text-muted-foreground">Builds are queued and distributed to available workers. Parallel builds supported.</p>
      </CardContent></Card>
      <Card><CardContent className="p-3"><h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Supported Targets</h4>{[
        { target: "apk", available: true }, { target: "aab", available: true }, { target: "web", available: true },
        { target: "linux", available: true }, { target: "windows", available: false }, { target: "macos", available: false },
      ].map(t => <div key={t.target} className="flex items-center gap-2 text-xs"><span className="font-mono text-foreground">{t.target}</span>{t.available ? <Badge variant="outline" className="text-[9px] text-emerald-600">available</Badge> : <Badge variant="outline" className="text-[9px] text-muted-foreground">unavailable</Badge>}</div>)}</CardContent></Card>
    </div>
  );
}

// ─── Device Farm ────────────────────────────────────────────────────────

function DeviceFarmPanel() {
  const { data, loading } = useFetch<any>("/api/v1/cloud/device-farm");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const devices = data?.data ?? [];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Device Farm ({devices.length})</h3>
      {devices.map((d: any) => (
        <div key={d.id} className={cn("rounded-lg border p-3", d.status === "available" ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-card")}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{d.name}</span>
            <Badge variant="outline" className="text-[9px] capitalize">{d.type.replace("-", " ")}</Badge>
            <Badge variant="outline" className={cn("text-[9px] capitalize", d.status === "available" ? "text-emerald-600" : "text-muted-foreground")}>{d.status}</Badge>
          </div>
          <div className="flex flex-wrap gap-1">{d.capabilities.map((c: string) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Artifacts ──────────────────────────────────────────────────────────

function ArtifactsPanel() {
  const { data, loading } = useFetch<any>("/api/v1/cloud/artifacts");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const artifacts = data?.data ?? [];
  if (artifacts.length === 0) return <EmptyState icon={FolderArchive} title="No artifacts yet" description="Build artifacts (APK, AAB, coverage, logs) will appear here after builds complete." />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Artifacts ({artifacts.length})</h3>
      {artifacts.map((a: any) => (
        <div key={a.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
          <Badge variant="outline" className="text-[9px] uppercase shrink-0">{a.type}</Badge>
          <span className="font-mono text-foreground">{a.name}</span>
          <span className="text-muted-foreground">{a.sizeMb}MB</span>
          {a.signed && <Badge variant="outline" className="text-[9px] text-emerald-600">signed</Badge>}
          <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Monitoring ─────────────────────────────────────────────────────────

function MonitoringPanel() {
  const { data, loading } = useFetch<any>("/api/v1/cloud/metrics");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const s = data?.data?.monitoring;
  if (!s) return <EmptyState icon={Activity} title="No monitoring data" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Monitoring</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Workers" value={s.totalWorkers} />
        <Metric label="Active Workers" value={s.activeWorkers} />
        <Metric label="Queued Jobs" value={s.queuedJobs} />
        <Metric label="Running Jobs" value={s.runningJobs} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Completed" value={s.completedJobs} />
        <Metric label="Failed" value={s.failedJobs} className={s.failedJobs > 0 ? "border-rose-500/30" : ""} />
        <Metric label="Avg CPU" value={`${s.averageCpu}%`} />
        <Metric label="Avg Memory" value={`${s.averageMemory}MB`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Success Rate" value={`${(s.successRate * 100).toFixed(0)}%`} className={s.successRate > 0.8 ? "border-emerald-500/30" : "border-amber-500/30"} />
        <Metric label="Avg Duration" value={`${s.averageDurationMs}ms`} />
      </div>
    </div>
  );
}

// ─── Logs ───────────────────────────────────────────────────────────────

function LogsPanel() {
  const { data, loading } = useFetch<any>("/api/v1/cloud/jobs");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const jobs = [...(data?.data?.queue ?? []), ...(data?.data?.completed ?? [])];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-2 font-mono text-[11px]">
      {jobs.flatMap((j: any) => j.stdout.map((line: string, i: number) => (
        <div key={`${j.id}-${i}`} className="flex items-start gap-2 py-0.5 hover:bg-muted/30">
          <span className="shrink-0 text-muted-foreground">[{j.runtimeType}]</span>
          <span className="shrink-0 text-sky-600">{j.type}</span>
          <span className="text-foreground">{line}</span>
        </div>
      )))}
      {jobs.length === 0 && <EmptyState icon={Terminal} title="No logs yet" />}
    </div>
  );
}

// ─── Runtime Adapters ───────────────────────────────────────────────────

function AdaptersPanel() {
  const adapters = [
    { type: "local", name: "Local Runtime", available: true, capabilities: ["build", "run", "test", "analyze", "pub"] },
    { type: "docker", name: "Docker Runtime", available: true, capabilities: ["build", "test", "analyze", "pub"] },
    { type: "remote", name: "Remote Runtime", available: false, capabilities: ["build", "run", "test", "analyze"] },
    { type: "cloud", name: "Cloud Runtime", available: false, capabilities: ["build", "test"] },
    { type: "ci", name: "CI Runtime", available: false, capabilities: ["build", "test", "analyze"] },
  ];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Runtime Adapters</h3>
      <p className="text-xs text-muted-foreground">Every runtime implements the same interface. Jobs can execute on any available adapter.</p>
      {adapters.map((a) => (
        <div key={a.type} className={cn("rounded-lg border p-3", a.available ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-card")}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{a.name}</span>
            {a.available ? <Badge variant="outline" className="text-[9px] text-emerald-600">available</Badge> : <Badge variant="outline" className="text-[9px] text-muted-foreground">unavailable</Badge>}
          </div>
          <div className="flex flex-wrap gap-1">{a.capabilities.map((c) => <Badge key={c} variant="outline" className="text-[9px]">{c}</Badge>)}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { data, loading } = useFetch<any>("/api/v1/cloud/metrics");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const m = data?.data?.metrics;
  if (!m) return <EmptyState icon={BarChart3} title="No metrics" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Cloud Metrics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Jobs" value={m.totalJobs} />
        <Metric label="Total Builds" value={m.totalBuilds} />
        <Metric label="Success Rate" value={`${(m.successRate * 100).toFixed(0)}%`} />
        <Metric label="Avg Duration" value={`${m.averageDurationMs}ms`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Worker Utilization" value={`${(m.workerUtilization * 100).toFixed(0)}%`} />
        <Metric label="Artifacts" value={m.totalArtifacts} />
        <Metric label="Cache Hit Rate" value={`${(m.cacheHitRate * 100).toFixed(0)}%`} />
        <Metric label="Est. Cost" value={`$${m.estimatedCostUsd}`} />
      </div>
    </div>
  );
}
