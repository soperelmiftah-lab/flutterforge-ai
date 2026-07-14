"use client";

import * as React from "react";
import { Terminal as TerminalIcon, Cpu, Monitor, Smartphone, FlaskConical, Activity, History, BarChart3, Stethoscope, Package, Layers, Zap, Play, Loader2, RefreshCw, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Runtime Dashboard", icon: TerminalIcon },
  { id: "sdk", label: "SDK Manager", icon: Layers },
  { id: "environment", label: "Environment", icon: Cpu },
  { id: "doctor", label: "Flutter Doctor", icon: Stethoscope },
  { id: "devices", label: "Devices", icon: Smartphone },
  { id: "emulators", label: "Emulators", icon: Monitor },
  { id: "build", label: "Build Center", icon: Package },
  { id: "run", label: "Run Center", icon: Play },
  { id: "analyze", label: "Analyze", icon: Activity },
  { id: "logs", label: "Log Viewer", icon: TerminalIcon },
  { id: "history", label: "History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function RuntimePage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              active === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />{t.label}
          </button>);})}
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "sdk" && <SdkPanel />}
        {active === "environment" && <EnvPanel />}
        {active === "doctor" && <DoctorPanel />}
        {active === "devices" && <DevicesPanel />}
        {active === "emulators" && <EmulatorsPanel />}
        {active === "build" && <BuildPanel />}
        {active === "run" && <RunPanel />}
        {active === "analyze" && <AnalyzePanel />}
        {active === "logs" && <LogsPanel />}
        {active === "history" && <HistoryPanel />}
        {active === "metrics" && <MetricsPanel />}
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (<div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}><div className="text-lg font-semibold text-foreground">{value}</div><div className="text-[10px] text-muted-foreground">{label}</div></div>);
}

function useFetch<T>(url: string): { data: T | null; loading: boolean; refresh: () => void } {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [nonce, setNonce] = React.useState(0);
  React.useEffect(() => { setLoading(true); fetch(url).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false)); }, [url, nonce]);
  return { data, loading, refresh: () => setNonce(n => n + 1) };
}

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { data: sdk } = useFetch<any>("/api/v1/runtime/sdk");
  const { data: devices } = useFetch<any>("/api/v1/runtime/devices");
  const { data: metrics } = useFetch<any>("/api/v1/runtime/metrics");
  const currentSdk = sdk?.current;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">⚡</div>
        <div><h2 className="text-lg font-semibold text-foreground">Flutter Runtime Platform</h2><p className="text-xs text-muted-foreground">SDK, builds, devices, runs, tests, logs, and metrics — unified runtime abstraction.</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Flutter SDK" value={currentSdk?.version ?? "—"} />
        <Metric label="Dart Version" value={currentSdk?.dartVersion ?? "—"} />
        <Metric label="Devices" value={devices?.total ?? 0} />
        <Metric label="Builds" value={metrics?.data?.buildCount ?? 0} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tabs.slice(1).map((t) => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => onNavigate(t.id)} className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
            <span className="text-xs font-medium text-foreground">{t.label}</span>
          </button>);})}
      </div>
    </div>
  );
}

function SdkPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/sdk"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Installed SDKs</h3>{data?.data?.map((s: any) => (<div key={s.path} className={cn("rounded-lg border p-3", s.isCurrent ? "border-primary/40 bg-primary/5" : "border-border/60")}><div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">Flutter {s.version}</span><Badge variant="outline" className="text-[9px] capitalize">{s.channel}</Badge>{s.isCurrent && <Badge variant="outline" className="text-[9px] text-emerald-600">current</Badge>}</div><div className="text-xs text-muted-foreground">Dart {s.dartVersion}</div><div className="text-[10px] font-mono text-muted-foreground">{s.path}</div></div>))}</div>); }
function EnvPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/environment"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const env = data?.data; if (!env) return null; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Environment</h3><div className="grid grid-cols-2 gap-3"><Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">System</h4><div className="text-xs">OS: <span className="capitalize text-foreground">{env.os}</span> · Arch: <span className="text-foreground">{env.arch}</span></div></CardContent></Card><Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Java</h4>{env.java ? <div className="text-xs text-foreground">{env.java.version}</div> : <span className="text-xs text-rose-600">Not found</span>}</CardContent></Card><Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Android SDK</h4>{env.androidSdk ? <div className="text-xs text-foreground">v{env.androidSdk.version}</div> : <span className="text-xs text-rose-600">Not found</span>}</CardContent></Card><Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Chrome</h4>{env.chrome ? <div className="text-xs text-foreground">{env.chrome.version}</div> : <span className="text-xs text-amber-600">Not found</span>}</CardContent></Card></div></div>); }
function DoctorPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/doctor"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const d = data?.data; if (!d) return null; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Flutter Doctor</h3><Badge variant="outline" className={cn("text-[9px] capitalize", d.overall === "pass" ? "text-emerald-600" : "text-amber-600")}>{d.overall}</Badge></div><p className="text-xs text-muted-foreground">{d.summary}</p>{d.checks.map((c: any) => (<div key={c.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2.5 text-xs"><span className={cn("mt-0.5 h-2 w-2 shrink-0 rounded-full", c.status === "pass" ? "bg-emerald-500" : c.status === "warning" ? "bg-amber-500" : "bg-rose-500")} /><div className="flex-1"><span className="font-medium text-foreground">{c.label}</span><p className="text-muted-foreground">{c.message}</p>{c.recommendation && <p className="text-amber-600 dark:text-amber-400">→ {c.recommendation}</p>}</div></div>))}</div>); }
function DevicesPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/devices"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const devices = data?.data ?? []; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Connected Devices ({devices.length})</h3>{devices.map((d: any) => (<div key={d.id} className="rounded-lg border border-border/60 bg-card p-3"><div className="flex items-center gap-2 mb-1"><span className="text-sm font-medium text-foreground">{d.name}</span><Badge variant="outline" className="text-[9px] capitalize">{d.platform}</Badge>{d.isBooted && <Badge variant="outline" className="text-[9px] text-emerald-600">booted</Badge>}</div><div className="text-[10px] text-muted-foreground">{d.resolution ?? "—"} · {d.architecture ?? "—"}</div></div>))}</div>); }
function EmulatorsPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/emulators"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const emus = data?.data ?? []; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Emulators ({emus.length})</h3>{emus.map((e: any) => (<div key={e.id} className="rounded-lg border border-border/60 bg-card p-3"><div className="flex items-center gap-2"><span className="text-sm font-medium text-foreground">{e.name}</span>{e.isRunning ? <Badge variant="outline" className="text-[9px] text-emerald-600">running</Badge> : <Badge variant="outline" className="text-[9px]">stopped</Badge>}</div></div>))}</div>); }
function BuildPanel() { const [building, setBuilding] = React.useState(false); const [result, setResult] = React.useState<any>(null); const build = async () => { setBuilding(true); try { const res = await fetch("/api/v1/runtime/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target: "apk", mode: "debug" }) }); const data = await res.json(); setResult(data.data); toast.success("Build complete"); } catch { toast.error("Build failed"); } setBuilding(false); }; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Build Center</h3><Button size="sm" onClick={build} disabled={building}>{building ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Package className="mr-1 h-3 w-3" />}Build APK</Button></div>{result && <Card><CardContent className="p-3"><div className="flex items-center gap-2 mb-2"><Badge variant="outline" className={cn("text-[9px]", result.status === "success" ? "text-emerald-600" : "text-rose-600")}>{result.status}</Badge><span className="text-xs text-muted-foreground">{result.durationMs}ms</span></div><pre className="ff-scroll max-h-40 overflow-y-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{result.logs.join("\n")}</pre></CardContent></Card>}</div>); }
function RunPanel() { const [session, setSession] = React.useState<any>(null); const [running, setRunning] = React.useState(false); const run = async () => { setRunning(true); try { const res = await fetch("/api/v1/runtime/run", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "chrome-1" }) }); const data = await res.json(); setSession(data.data); toast.success("App running"); } catch { toast.error("Run failed"); } setRunning(false); }; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Run Center</h3><Button size="sm" onClick={run} disabled={running}>{running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}Run</Button></div>{session && <Card><CardContent className="p-3"><div className="flex items-center gap-2"><Badge variant="outline" className="text-[9px] text-emerald-600">{session.status}</Badge><span className="text-xs text-muted-foreground">PID: {session.pid} · {session.deviceId}</span></div><pre className="ff-scroll mt-2 max-h-40 overflow-y-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{session.logs.join("\n")}</pre></CardContent></Card>}</div>); }
function AnalyzePanel() { const [result, setResult] = React.useState<any>(null); const [loading, setLoading] = React.useState(false); const analyze = async () => { setLoading(true); try { const res = await fetch("/api/v1/runtime/analyze", { method: "POST" }); const data = await res.json(); setResult(data.data); toast.success("Analysis complete"); } catch { toast.error("Failed"); } setLoading(false); }; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Code Analysis</h3><Button size="sm" onClick={analyze} disabled={loading}>{loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Activity className="mr-1 h-3.5 w-3.5" />}Analyze</Button></div>{result && <div className="grid grid-cols-3 gap-3"><Metric label="Errors" value={result.errorCount} /><Metric label="Warnings" value={result.warningCount} /><Metric label="Info" value={result.infoCount} /></div>}</div>); }
function LogsPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/logs"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const logs = data?.data ?? []; const colors: Record<string, string> = { debug: "text-muted-foreground", info: "text-sky-600", warning: "text-amber-600", error: "text-rose-600", fatal: "text-rose-600 font-bold" }; return (<div className="ff-scroll h-full overflow-y-auto p-2 font-mono text-[11px]">{logs.map((l: any) => (<div key={l.id} className="flex items-start gap-2 py-0.5 hover:bg-muted/30"><span className="shrink-0 text-muted-foreground">{new Date(l.timestamp).toLocaleTimeString()}</span><span className={cn("shrink-0 uppercase font-medium", colors[l.level])}>{l.level}</span><span className="shrink-0 text-muted-foreground">[{l.source}]</span><span className="text-foreground">{l.message}</span></div>))}</div>); }
function HistoryPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/history"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const entries = data?.data ?? []; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Runtime History</h3>{entries.length === 0 ? <p className="text-xs text-muted-foreground">No history yet.</p> : entries.map((h: any) => (<div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs"><Badge variant="outline" className="text-[9px] capitalize">{h.action}</Badge><span className={h.success ? "text-emerald-600" : "text-rose-600"}>{h.success ? "✓" : "✗"}</span><span className="ml-auto text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span></div>))}</div>); }
function MetricsPanel() { const { data, loading } = useFetch<any>("/api/v1/runtime/metrics"); if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>; const m = data?.data; if (!m) return null; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><h3 className="text-sm font-semibold text-foreground">Runtime Metrics</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Runs" value={m.runCount} /><Metric label="Builds" value={m.buildCount} /><Metric label="Analyzes" value={m.analyzeCount} /><Metric label="Tests" value={m.testCount} /></div></div>); }
