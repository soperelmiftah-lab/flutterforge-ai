"use client";

import * as React from "react";
import {
  Eye, Smartphone, Camera, Layers, Activity, Monitor, Terminal,
  Gauge, Zap, History, BarChart3, Wifi, Play, Square, RefreshCw,
  Loader2, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Visual Runtime", icon: Eye },
  { id: "bridge", label: "Android Bridge", icon: Smartphone },
  { id: "preview", label: "Device Preview", icon: Monitor },
  { id: "screenshots", label: "Screenshots", icon: Camera },
  { id: "widgets", label: "Widget Inspector", icon: Layers },
  { id: "layout", label: "Layout Inspector", icon: Activity },
  { id: "render", label: "Render Tree", icon: Layers },
  { id: "frames", label: "Frame Monitor", icon: Gauge },
  { id: "performance", label: "Performance", icon: Zap },
  { id: "console", label: "Console", icon: Terminal },
  { id: "events", label: "Events", icon: Activity },
  { id: "vision", label: "Vision Context", icon: Eye },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function VisualRuntimePage() {
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
        {active === "bridge" && <BridgePanel />}
        {active === "preview" && <PreviewPanel />}
        {active === "screenshots" && <ScreenshotGallery />}
        {active === "widgets" && <WidgetInspectorPanel />}
        {active === "layout" && <LayoutPanel />}
        {active === "render" && <RenderTreePanel />}
        {active === "frames" && <FrameMonitorPanel />}
        {active === "performance" && <PerformancePanel />}
        {active === "console" && <ConsolePanel />}
        {active === "events" && <EventsPanel />}
        {active === "vision" && <VisionContextPanel />}
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
  React.useEffect(() => {
    setLoading(true);
    fetch(url).then(r => r.json()).then(d => setData(d)).catch(() => {}).finally(() => setLoading(false));
  }, [url, nonce]);
  return { data, loading, refresh: () => setNonce(n => n + 1) };
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { data: devices } = useFetch<any>("/api/v1/visual/devices");
  const { data: metrics } = useFetch<any>("/api/v1/visual/metrics");
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">👁️</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visual Runtime & Device Bridge</h2>
          <p className="text-xs text-muted-foreground">Connects to Android devices, emulators & browser previews — captures screenshots, inspects widgets, monitors performance, and provides visual context for AI.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Connected Devices" value={devices?.connected ?? 0} />
        <Metric label="Screenshots" value={metrics?.data?.totalScreenshots ?? 0} />
        <Metric label="Avg FPS" value={metrics?.data?.averageFps ?? 60} />
        <Metric label="Layout Issues" value={metrics?.data?.layoutIssuesFound ?? 0} />
      </div>
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

// ─── Android Bridge ─────────────────────────────────────────────────────

function BridgePanel() {
  const { data, loading, refresh } = useFetch<any>("/api/v1/visual/devices");
  const [connecting, setConnecting] = React.useState<string | null>(null);

  const handleConnect = async (deviceId: string) => {
    setConnecting(deviceId);
    try {
      await fetch("/api/v1/visual/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId }) });
      toast.success("Device connected");
      refresh();
    } catch { toast.error("Connection failed"); }
    setConnecting(null);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const devices = data?.data ?? [];
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Android Device Bridge ({devices.length})</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
      </div>
      {devices.map((d: any) => (
        <div key={d.id} className={cn("rounded-lg border p-3", d.isConnected ? "border-emerald-500/30 bg-emerald-500/5" : "border-border/60 bg-card")}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">{d.name}</span>
            <Badge variant="outline" className="text-[9px] capitalize">{d.connection}</Badge>
            {d.isConnected ? <Badge variant="outline" className="text-[9px] text-emerald-600">connected</Badge> : <Badge variant="outline" className="text-[9px]">disconnected</Badge>}
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground mb-2">
            <div>Manufacturer: <span className="text-foreground">{d.manufacturer}</span></div>
            <div>Model: <span className="text-foreground">{d.model}</span></div>
            <div>ABI: <span className="text-foreground">{d.abi}</span></div>
            <div>SDK: <span className="text-foreground">{d.sdkVersion} (Android {d.androidVersion})</span></div>
            <div>Battery: <span className="text-foreground">{d.batteryLevel}%</span></div>
            <div>Memory: <span className="text-foreground">{d.memoryMb}MB</span></div>
            <div>Storage: <span className="text-foreground">{d.storageAvailableMb}MB / {d.storageTotalMb}MB</span></div>
            <div>Resolution: <span className="text-foreground">{d.resolution} ({d.density}dpi)</span></div>
          </div>
          <div className="flex gap-2">
            {!d.isConnected ? (
              <Button size="sm" className="h-7 text-xs" onClick={() => handleConnect(d.id)} disabled={connecting === d.id}>
                {connecting === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wifi className="mr-1 h-3 w-3" />}
                Connect
              </Button>
            ) : (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { fetch("/api/v1/visual/disconnect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: d.id }) }).then(() => { toast.success("Disconnected"); refresh(); }); }}>
                Disconnect
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Device Preview ─────────────────────────────────────────────────────

function PreviewPanel() {
  const [streaming, setStreaming] = React.useState(false);
  const [screenshot, setScreenshot] = React.useState<any>(null);

  const capture = async () => {
    try { const res = await fetch("/api/v1/visual/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "emulator-5554" }) }); const data = await res.json(); setScreenshot(data.data); toast.success("Screenshot captured"); } catch { toast.error("Capture failed"); }
  };
  const toggleStream = async () => {
    if (streaming) { await fetch("/api/v1/visual/stream/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "emulator-5554" }) }); setStreaming(false); toast.success("Stream stopped"); }
    else { await fetch("/api/v1/visual/stream/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "emulator-5554" }) }); setStreaming(true); toast.success("Stream started"); }
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Device Preview</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={capture}><Camera className="mr-1 h-3 w-3" />Capture</Button>
          <Button size="sm" className="h-7 text-xs" onClick={toggleStream}>{streaming ? <Square className="mr-1 h-3 w-3" /> : <Play className="mr-1 h-3 w-3" />}{streaming ? "Stop" : "Stream"}</Button>
        </div>
      </div>
      <div className="flex items-center justify-center rounded-xl border border-border/60 bg-muted/10 p-6">
        {screenshot ? (
          <div className="text-center">
            <img src={screenshot.dataUrl} alt="Screenshot" className="max-h-[400px] rounded-lg border border-border shadow-lg" />
            <p className="mt-2 text-[10px] text-muted-foreground">{screenshot.width}x{screenshot.height} · {screenshot.orientation} · {new Date(screenshot.timestamp).toLocaleTimeString()}</p>
          </div>
        ) : (
          <div className="flex h-[400px] w-[240px] flex-col items-center justify-center rounded-2xl border-4 border-foreground/80 bg-gradient-to-b from-primary/10 to-background p-4">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-foreground/30" />
            <div className="mt-8 flex flex-1 flex-col items-center justify-center gap-2">
              <Monitor className="h-8 w-8 text-primary" />
              <span className="text-xs text-muted-foreground">{streaming ? "Live streaming..." : "No preview"}</span>
              {streaming && <span className="text-[10px] text-emerald-600">● 30 FPS</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Screenshot Gallery ─────────────────────────────────────────────────

function ScreenshotGallery() {
  const { data, loading, refresh } = useFetch<any>("/api/v1/visual/screenshots");
  const [selected, setSelected] = React.useState<any>(null);
  const capture = async () => { await fetch("/api/v1/visual/capture", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deviceId: "emulator-5554" }) }); refresh(); toast.success("Captured"); };
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const screenshots = data?.data ?? [];
  return (
    <div className="flex h-full">
      <div className="flex w-48 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-2"><Button size="sm" className="h-7 w-full text-xs" onClick={capture}><Camera className="mr-1 h-3 w-3" />Capture</Button></div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2 space-y-2">
          {screenshots.length === 0 ? <p className="text-xs text-muted-foreground p-2">No screenshots yet.</p> : screenshots.map((s: any) => (
            <button key={s.id} onClick={() => setSelected(s)} className={cn("block w-full overflow-hidden rounded-md border transition-colors", selected?.id === s.id ? "border-primary" : "border-border/60 hover:border-primary/40")}>
              <img src={s.dataUrl} alt={s.id} className="aspect-[9/16] w-full object-cover" />
              <div className="p-1 text-[8px] text-muted-foreground">{new Date(s.timestamp).toLocaleTimeString()}</div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center p-4">
        {selected ? <div className="text-center"><img src={selected.dataUrl} alt="Screenshot" className="max-h-[500px] rounded-lg border border-border shadow-lg" /><p className="mt-2 text-xs text-muted-foreground">{selected.width}x{selected.height} · {selected.orientation}</p></div> : <EmptyState icon={Camera} title="Select a screenshot" />}
      </div>
    </div>
  );
}

// ─── Widget Inspector ───────────────────────────────────────────────────

function WidgetInspectorPanel() {
  const { data, loading } = useFetch<any>("/api/v1/visual/widget-tree");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const tree = data?.data;
  if (!tree) return <EmptyState icon={Layers} title="No widget tree" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total Widgets" value={tree.totalNodes} />
        <Metric label="Max Depth" value={tree.maxDepth} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Widget Hierarchy</h4>
        <div className="ff-scroll max-h-[500px] overflow-y-auto">
          {renderWidgetNode(tree.root, 0)}
        </div>
      </CardContent></Card>
    </div>
  );
}

function renderWidgetNode(node: any, depth: number): React.ReactNode {
  return (
    <div key={node.id}>
      <div className="flex items-center gap-1 py-0.5 text-xs hover:bg-muted/30" style={{ paddingLeft: depth * 12 }}>
        <span className={cn("h-1.5 w-1.5 rounded-full", node.isFocused ? "bg-primary" : "bg-muted-foreground")} />
        <span className="font-mono text-foreground">{node.type}</span>
        {node.key && <Badge variant="outline" className="text-[8px]">key: {node.key}</Badge>}
        {Object.keys(node.properties ?? {}).length > 0 && <span className="text-[9px] text-muted-foreground">{Object.keys(node.properties).length} props</span>}
      </div>
      {node.children?.map((c: any) => renderWidgetNode(c, depth + 1))}
    </div>
  );
}

// ─── Layout Inspector ───────────────────────────────────────────────────

function LayoutPanel() {
  const { data, loading } = useFetch<any>("/api/v1/visual/layout");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const report = data?.data;
  if (!report) return <EmptyState icon={Activity} title="No layout data" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Total Widgets" value={report.totalWidgets} />
        <Metric label="Issues Found" value={report.issueCount} className={report.issueCount > 0 ? "border-amber-500/30" : ""} />
      </div>
      <div className="space-y-1.5">
        {report.issues.map((issue: any) => (
          <div key={issue.id} className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-2.5 text-xs">
            <Badge variant="outline" className={cn("text-[9px] shrink-0 capitalize", issue.severity === "error" ? "text-rose-600" : issue.severity === "warning" ? "text-amber-600" : "text-muted-foreground")}>{issue.severity}</Badge>
            <div className="flex-1">
              <span className="font-mono text-foreground">{issue.widgetType}</span>
              <span className="ml-1 capitalize text-muted-foreground">({issue.type.replace("-", " ")})</span>
              <p className="text-muted-foreground">{issue.message}</p>
              <p className="text-[9px] text-muted-foreground">Rect: {issue.rect.x},{issue.rect.y} {issue.rect.width}x{issue.rect.height}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Render Tree ────────────────────────────────────────────────────────

function RenderTreePanel() {
  const { data, loading } = useFetch<any>("/api/v1/visual/render-tree");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const tree = data?.data;
  if (!tree) return <EmptyState icon={Layers} title="No render tree" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Render Nodes" value={tree.totalNodes} />
        <Metric label="Total Layout" value={`${tree.totalLayoutTimeMs.toFixed(2)}ms`} />
        <Metric label="Total Paint" value={`${tree.totalPaintTimeMs.toFixed(2)}ms`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Render Tree</h4>
        <div className="ff-scroll max-h-[500px] overflow-y-auto">
          {renderRenderNode(tree.root, 0)}
        </div>
      </CardContent></Card>
    </div>
  );
}

function renderRenderNode(node: any, depth: number): React.ReactNode {
  return (
    <div key={node.id}>
      <div className="flex items-center gap-2 py-0.5 text-xs hover:bg-muted/30" style={{ paddingLeft: depth * 12 }}>
        <span className="font-mono text-foreground">{node.type}</span>
        <span className="text-[9px] text-amber-600">L:{node.layoutTimeMs}ms</span>
        <span className="text-[9px] text-sky-600">P:{node.paintTimeMs}ms</span>
      </div>
      {node.children?.map((c: any) => renderRenderNode(c, depth + 1))}
    </div>
  );
}

// ─── Frame Monitor ──────────────────────────────────────────────────────

function FrameMonitorPanel() {
  const [stats, setStats] = React.useState<any>(null);
  const refresh = () => {
    import("@/features/visual-runtime/frame-monitor").then(({ getFrameStats }) => setStats(getFrameStats()));
  };
  React.useEffect(() => { refresh(); const interval = setInterval(refresh, 1000); return () => clearInterval(interval); }, []);
  if (!stats) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Frame Monitor (Live)</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="FPS" value={stats.fps} className={stats.fps < 50 ? "border-amber-500/30" : "border-emerald-500/30"} />
        <Metric label="Avg Frame" value={`${stats.avgFrameDurationMs}ms`} />
        <Metric label="Max Frame" value={`${stats.maxFrameDurationMs}ms`} />
        <Metric label="Dropped" value={stats.droppedFrames} />
        <Metric label="Jank Count" value={stats.jankCount} className={stats.jankCount > 0 ? "border-rose-500/30" : ""} />
        <Metric label="Status" value={stats.isJanky ? "Janky" : "Smooth"} className={stats.isJanky ? "border-rose-500/30" : "border-emerald-500/30"} />
      </div>
      <Card><CardContent className="p-4">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">FPS Over Time</h4>
        <div className="flex h-32 items-end gap-0.5">
          {Array.from({ length: 40 }).map((_, i) => {
            const h = Math.random() * 80 + 20;
            return <div key={i} className={cn("flex-1 rounded-t", h < 40 ? "bg-rose-500" : h < 60 ? "bg-amber-500" : "bg-emerald-500")} style={{ height: `${h}%` }} />;
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Performance ────────────────────────────────────────────────────────

function PerformancePanel() {
  const [perf, setPerf] = React.useState<any>(null);
  React.useEffect(() => { import("@/features/visual-runtime/performance-overlay").then(({ getPerformanceOverlay }) => setPerf(getPerformanceOverlay())); const i = setInterval(() => import("@/features/visual-runtime/performance-overlay").then(({ getPerformanceOverlay }) => setPerf(getPerformanceOverlay())), 2000); return () => clearInterval(i); }, []);
  if (!perf) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Performance Overlay (Live)</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Raster Time" value={`${perf.rasterTimeMs}ms`} />
        <Metric label="UI Thread" value={`${perf.uiThreadTimeMs}ms`} />
        <Metric label="GPU Time" value={`${perf.gpuTimeMs}ms`} />
        <Metric label="Memory" value={`${perf.memoryMb}MB`} />
      </div>
      <Card><CardContent className="p-4">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Raster vs UI (ms)</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs"><span className="w-20 text-muted-foreground">Raster</span><div className="h-4 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-amber-500" style={{ width: `${Math.min(100, perf.rasterTimeMs * 10)}%` }} /></div><span className="w-12 text-right font-mono">{perf.rasterTimeMs}ms</span></div>
          <div className="flex items-center gap-2 text-xs"><span className="w-20 text-muted-foreground">UI Thread</span><div className="h-4 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-sky-500" style={{ width: `${Math.min(100, perf.uiThreadTimeMs * 10)}%` }} /></div><span className="w-12 text-right font-mono">{perf.uiThreadTimeMs}ms</span></div>
          <div className="flex items-center gap-2 text-xs"><span className="w-20 text-muted-foreground">GPU</span><div className="h-4 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-violet-500" style={{ width: `${Math.min(100, perf.gpuTimeMs * 10)}%` }} /></div><span className="w-12 text-right font-mono">{perf.gpuTimeMs}ms</span></div>
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Console ────────────────────────────────────────────────────────────

function ConsolePanel() {
  const [entries, setEntries] = React.useState<any[]>([]);
  React.useEffect(() => { import("@/features/visual-runtime/console-stream").then(({ getEntries }) => setEntries(getEntries({ limit: 100 }))); }, []);
  const levelColors: Record<string, string> = { debug: "text-muted-foreground", info: "text-sky-600", warning: "text-amber-600", error: "text-rose-600", fatal: "text-rose-600 font-bold" };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-2 font-mono text-[11px]">
      {entries.map((e: any) => (
        <div key={e.id} className="flex items-start gap-2 py-0.5 hover:bg-muted/30">
          <span className="shrink-0 text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
          <span className={cn("shrink-0 uppercase font-medium", levelColors[e.level])}>{e.level}</span>
          <span className="shrink-0 text-muted-foreground">[{e.source}]</span>
          <span className="text-foreground">{e.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Events ─────────────────────────────────────────────────────────────

function EventsPanel() {
  const [events, setEvents] = React.useState<any[]>([]);
  React.useEffect(() => { import("@/features/visual-runtime/events").then(({ getEvents }) => setEvents(getEvents(undefined, 50))); }, []);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Visual Events</h3>
      {events.map((e: any) => (
        <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
          <Badge variant="outline" className="text-[9px] capitalize shrink-0">{e.type.replace("-", " ")}</Badge>
          <span className="font-mono text-muted-foreground">{JSON.stringify(e.details)}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Vision Context ─────────────────────────────────────────────────────

function VisionContextPanel() {
  const [ctx, setCtx] = React.useState<any>(null);
  React.useEffect(() => { import("@/features/visual-runtime/vision-context").then(({ buildVisionContext }) => setCtx(buildVisionContext("emulator-5554"))); }, []);
  if (!ctx) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Vision Context (for AI)</h3>
      <p className="text-xs text-muted-foreground">Structured visual context that future AI agents will consume for autonomous debugging and UI refinement.</p>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Current Screen</h4>
        <p className="text-sm text-foreground">{ctx.currentScreen}</p>
      </CardContent></Card>
      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Widget Tree</h4>
          <div className="space-y-0.5 text-xs"><div>Widgets: <span className="text-foreground">{ctx.widgetTreeSummary.totalWidgets}</span></div><div>Depth: <span className="text-foreground">{ctx.widgetTreeSummary.maxDepth}</span></div><div>Top: <span className="font-mono text-foreground">{ctx.widgetTreeSummary.topWidgets.join(", ")}</span></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Layout</h4>
          <div className="space-y-0.5 text-xs"><div>Issues: <span className="text-foreground">{ctx.layoutSummary.totalIssues}</span></div><div>Overflows: <span className="text-foreground">{ctx.layoutSummary.overflowCount}</span></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Runtime</h4>
          <div className="space-y-0.5 text-xs"><div>FPS: <span className="text-foreground">{ctx.runtimeState.fps}</span></div><div>Jank: <span className="text-foreground">{ctx.runtimeState.jankCount}</span></div><div>Memory: <span className="text-foreground">{ctx.runtimeState.memoryMb}MB</span></div></div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Navigation</h4>
          <div className="space-y-0.5 text-xs"><div>Route: <span className="font-mono text-foreground">{ctx.navigationState.currentRoute}</span></div><div>Stack: <span className="font-mono text-foreground">{ctx.navigationState.routeStack.join(" → ")}</span></div></div>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { data, loading } = useFetch<any>("/api/v1/visual/metrics");
  if (loading) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const m = data?.data;
  if (!m) return <EmptyState icon={BarChart3} title="No metrics" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Visual Runtime Metrics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Screenshots" value={m.totalScreenshots} />
        <Metric label="Streams" value={m.totalStreams} />
        <Metric label="Connections" value={m.totalConnections} />
        <Metric label="Avg FPS" value={m.averageFps} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="Jank Count" value={m.jankCount} className={m.jankCount > 0 ? "border-amber-500/30" : ""} />
        <Metric label="Layout Issues" value={m.layoutIssuesFound} className={m.layoutIssuesFound > 0 ? "border-amber-500/30" : ""} />
        <Metric label="Runtime Errors" value={m.runtimeErrors} className={m.runtimeErrors > 0 ? "border-rose-500/30" : ""} />
      </div>
    </div>
  );
}

void History;
