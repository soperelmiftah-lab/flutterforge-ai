"use client";

import * as React from "react";
import {
  Eye, Smartphone, Camera, Layers, Activity, Monitor, Terminal,
  Gauge, Zap, History, BarChart3, Wifi, Play, Square, RefreshCw,
  Loader2, RotateCw, Trash2, Pause, X, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useVisualRuntimeStore } from "@/stores";
import type { ConsoleLevel, EventType } from "@/features/visual-runtime/types";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Visual Runtime", icon: Eye },
  { id: "bridge", label: "Device Bridge", icon: Smartphone },
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
  const hydrate = useVisualRuntimeStore((s) => s.hydrate);

  React.useEffect(() => { void hydrate(); }, [hydrate]);

  // Poll frame stats every 3s.
  const refreshFrames = useVisualRuntimeStore((s) => s.refreshFrames);
  React.useEffect(() => {
    const id = setInterval(() => void refreshFrames(), 3000);
    return () => clearInterval(id);
  }, [refreshFrames]);

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

function levelColor(l: ConsoleLevel): string {
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
  const { devices, connectedDevices, screenshots, metrics, activeSessions } = useVisualRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">👁️</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Visual Runtime & Device Bridge</h2>
          <p className="text-xs text-muted-foreground">Real in-memory visual runtime — devices persist, screenshots accumulate, streams are stateful, events recorded, frame stats tracked over time.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Connected Devices" value={connectedDevices.length} />
        <Metric label="Active Sessions" value={activeSessions.length} />
        <Metric label="Screenshots" value={screenshots.length} />
        <Metric label="Avg FPS" value={metrics?.averageFps ?? 60} />
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

// ─── Device Bridge ──────────────────────────────────────────────────────

function BridgePanel() {
  const { devices, connectDevice, disconnectDevice, toggleOrientation, refreshDevices } = useVisualRuntimeStore();
  const [busy, setBusy] = React.useState<string | null>(null);

  const handleConnect = async (id: string) => {
    setBusy(id);
    const ok = await connectDevice(id);
    toast(ok ? "Device connected" : "Connection failed", { description: ok ? undefined : "See console for details" });
    setBusy(null);
  };
  const handleDisconnect = async (id: string) => {
    setBusy(id);
    await disconnectDevice(id);
    toast("Device disconnected");
    setBusy(null);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Device Bridge ({devices.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshDevices()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      {devices.length === 0 ? (
        <EmptyState icon={Smartphone} title="No devices" description="No devices discovered." />
      ) : (
        devices.map((d) => (
          <Card key={d.id}>
            <CardContent className="p-3">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] capitalize">{d.connection}</Badge>
                <span className="text-sm font-medium text-foreground">{d.name}</span>
                {d.isConnected ? (
                  <Badge variant="outline" className="text-[9px] text-emerald-600">connected</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px]">disconnected</Badge>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {d.isConnected && (
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => void toggleOrientation(d.id)}>
                      <RotateCw className="h-3 w-3" />
                    </Button>
                  )}
                  {d.isConnected ? (
                    <Button size="sm" variant="outline" className="h-7 text-xs" disabled={busy === d.id} onClick={() => void handleDisconnect(d.id)}>
                      {busy === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    </Button>
                  ) : (
                    <Button size="sm" variant="default" className="h-7 text-xs" disabled={busy === d.id} onClick={() => void handleConnect(d.id)}>
                      {busy === d.id ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Wifi className="mr-1 h-3 w-3" />}
                      Connect
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[10px] text-muted-foreground sm:grid-cols-4">
                <div>Model: <span className="text-foreground">{d.model}</span></div>
                <div>Android: <span className="text-foreground">{d.androidVersion} (SDK {d.sdkVersion})</span></div>
                <div>Resolution: <span className="text-foreground">{d.resolution}</span></div>
                <div>Orientation: <span className="capitalize text-foreground">{d.orientation}</span></div>
                <div>Battery: <span className="text-foreground">{d.batteryLevel}%</span></div>
                <div>Memory: <span className="text-foreground">{d.memoryMb}MB</span></div>
                <div>Storage: <span className="text-foreground">{(d.storageAvailableMb / 1024).toFixed(1)}/{(d.storageTotalMb / 1024).toFixed(0)}GB</span></div>
                <div>ABI: <span className="text-foreground">{d.abi}</span></div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// ─── Device Preview ─────────────────────────────────────────────────────

function PreviewPanel() {
  const { devices, connectedDevices, selectedDeviceId, setSelectedDevice, captureScreenshot, screenshots, toggleOrientation, startStream, stopStream, streams } = useVisualRuntimeStore();
  const [capturing, setCapturing] = React.useState(false);

  const selected = connectedDevices.find((d) => d.id === selectedDeviceId) ?? connectedDevices[0];
  const activeStream = selected ? streams.find((s) => s.deviceId === selected.id && s.status !== "stopped") : undefined;
  const lastScreenshot = selected ? screenshots.find((s) => s.deviceId === selected.id) : undefined;

  const handleCapture = async () => {
    if (!selected) return;
    setCapturing(true);
    const shot = await captureScreenshot(selected.id);
    if (shot) toast.success("Screenshot captured");
    else toast.error("Capture failed (device not connected?)");
    setCapturing(false);
  };

  if (connectedDevices.length === 0) {
    return <EmptyState icon={Monitor} title="No connected devices" description="Go to Device Bridge and connect a device first." />;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selected?.id ?? ""} onValueChange={setSelectedDevice}>
          <SelectTrigger className="w-64"><SelectValue placeholder="Select device…" /></SelectTrigger>
          <SelectContent>
            {connectedDevices.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name} ({d.platform ?? d.connection})</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleCapture} disabled={capturing || !selected}>
          {capturing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
          Capture
        </Button>
        <Button size="sm" variant="outline" onClick={() => selected && void toggleOrientation(selected.id)} disabled={!selected}>
          <RotateCw className="mr-1 h-3.5 w-3.5" />Rotate
        </Button>
        {activeStream ? (
          <Button size="sm" variant="outline" onClick={() => selected && void stopStream(selected.id)}>
            <Square className="mr-1 h-3.5 w-3.5" />Stop Stream
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => selected && void startStream(selected.id)} disabled={!selected}>
            <Play className="mr-1 h-3.5 w-3.5" />Start Stream
          </Button>
        )}
        {activeStream && (
          <Badge variant="outline" className="text-[9px] text-emerald-600 capitalize">{activeStream.status} · {activeStream.fps} fps</Badge>
        )}
      </div>

      {selected && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{selected.name}</h4>
              <span className="text-[10px] text-muted-foreground">{selected.resolution} · {selected.orientation}</span>
            </div>
            <div className="flex justify-center rounded-lg bg-muted/30 p-4">
              {lastScreenshot ? (
                <img
                  src={lastScreenshot.dataUrl}
                  alt={`Screenshot ${lastScreenshot.id}`}
                  className="max-h-[60vh] rounded shadow-md"
                  style={{ maxWidth: "100%" }}
                />
              ) : (
                <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
                  <Monitor className="mb-2 h-12 w-12 opacity-50" />
                  <p className="text-xs">Click Capture to take a screenshot</p>
                </div>
              )}
            </div>
            {lastScreenshot && (
              <p className="mt-2 text-center text-[10px] text-muted-foreground">
                Captured at {new Date(lastScreenshot.timestamp).toLocaleTimeString()} · {lastScreenshot.width}x{lastScreenshot.height}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Screenshots ────────────────────────────────────────────────────────

function ScreenshotGallery() {
  const { screenshots, clearScreenshots, refreshScreenshots } = useVisualRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Screenshots ({screenshots.length})</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void refreshScreenshots()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void clearScreenshots()}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {screenshots.length === 0 ? (
        <EmptyState icon={Camera} title="No screenshots" description="Capture a screenshot from the Device Preview tab." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {screenshots.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-2">
                <img src={s.dataUrl} alt={s.id} className="aspect-[9/16] w-full rounded bg-muted object-cover" />
                <div className="mt-1 text-[10px] text-muted-foreground">
                  <div className="truncate font-mono">{s.deviceId}</div>
                  <div>{new Date(s.timestamp).toLocaleTimeString()} · {s.width}x{s.height}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Widget Inspector ───────────────────────────────────────────────────

function WidgetInspectorPanel() {
  const { widgetTree, captureWidgetTree } = useVisualRuntimeStore();
  React.useEffect(() => { void captureWidgetTree(); }, [captureWidgetTree]);
  if (!widgetTree) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Widget Tree</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px]">{widgetTree.totalNodes} nodes</Badge>
          <Badge variant="outline" className="text-[9px]">depth {widgetTree.maxDepth}</Badge>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void captureWidgetTree()}>
            <RefreshCw className="mr-1 h-3 w-3" />Refresh
          </Button>
        </div>
      </div>
      <Card><CardContent className="p-3">
        <WidgetNodeView node={widgetTree.root as any} />
      </CardContent></Card>
    </div>
  );
}

function WidgetNodeView({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="text-xs">
      <div
        className="flex items-center gap-1 py-0.5 hover:bg-muted/30"
        style={{ paddingLeft: depth * 12 }}
      >
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">
            {expanded ? "▼" : "▶"}
          </button>
        ) : (
          <span className="w-3 text-muted-foreground">·</span>
        )}
        <span className="font-mono font-medium text-foreground">{node.type}</span>
        {node.isFocused && <Badge variant="outline" className="text-[9px] text-amber-600">focused</Badge>}
        {!node.isVisible && <Badge variant="outline" className="text-[9px]">hidden</Badge>}
        {node.key && <span className="text-[10px] text-muted-foreground">key: {node.key}</span>}
      </div>
      {expanded && hasChildren && (
        <div>
          {node.children.map((c: any, i: number) => <WidgetNodeView key={i} node={c} depth={depth + 1} />)}
        </div>
      )}
      {expanded && Object.keys(node.properties ?? {}).length > 0 && (
        <div className="ml-6 mb-1 text-[10px] text-muted-foreground">
          {Object.entries(node.properties).slice(0, 3).map(([k, v]) => (
            <div key={k} className="font-mono">{k}: {String(v).slice(0, 60)}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layout Inspector ───────────────────────────────────────────────────

function LayoutPanel() {
  const { layoutReport, analyzeLayout } = useVisualRuntimeStore();
  React.useEffect(() => { void analyzeLayout(); }, [analyzeLayout]);
  if (!layoutReport) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Layout Inspector</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void analyzeLayout()}>
          <RefreshCw className="mr-1 h-3 w-3" />Re-analyze
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Total Widgets" value={layoutReport.totalWidgets} />
        <Metric label="Issues" value={layoutReport.issueCount} />
        <Metric label="Errors" value={layoutReport.issues.filter((i) => i.severity === "error").length} />
      </div>
      {layoutReport.issues.length === 0 ? (
        <Card><CardContent className="p-4"><p className="text-xs text-emerald-600">✓ No layout issues detected.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {layoutReport.issues.map((i) => (
            <Card key={i.id}><CardContent className="p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", i.severity === "error" ? "text-rose-600" : i.severity === "warning" ? "text-amber-600" : "text-sky-600")}>{i.severity}</Badge>
                <Badge variant="outline" className="text-[9px]">{i.type}</Badge>
                <span className="font-mono text-foreground">{i.widgetType}</span>
              </div>
              <p className="text-muted-foreground">{i.message}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">rect: {i.rect.x},{i.rect.y} · {i.rect.width}x{i.rect.height}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Render Tree ────────────────────────────────────────────────────────

function RenderTreePanel() {
  const { renderTree, captureRenderTree } = useVisualRuntimeStore();
  React.useEffect(() => { void captureRenderTree(); }, [captureRenderTree]);
  if (!renderTree) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Render Tree</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px]">{renderTree.totalNodes} nodes</Badge>
          <Badge variant="outline" className="text-[9px]">L: {renderTree.totalLayoutTimeMs.toFixed(2)}ms</Badge>
          <Badge variant="outline" className="text-[9px]">P: {renderTree.totalPaintTimeMs.toFixed(2)}ms</Badge>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void captureRenderTree()}>
            <RefreshCw className="mr-1 h-3 w-3" />Refresh
          </Button>
        </div>
      </div>
      <Card><CardContent className="p-3">
        <RenderNodeView node={renderTree.root as any} />
      </CardContent></Card>
    </div>
  );
}

function RenderNodeView({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = React.useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  return (
    <div className="text-xs">
      <div className="flex items-center gap-1 py-0.5 hover:bg-muted/30" style={{ paddingLeft: depth * 12 }}>
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-muted-foreground">{expanded ? "▼" : "▶"}</button>
        ) : (
          <span className="w-3 text-muted-foreground">·</span>
        )}
        <span className="font-mono font-medium text-foreground">{node.type}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">L:{node.layoutTimeMs}ms · P:{node.paintTimeMs}ms</span>
      </div>
      {expanded && hasChildren && (
        <div>{node.children.map((c: any, i: number) => <RenderNodeView key={i} node={c} depth={depth + 1} />)}</div>
      )}
    </div>
  );
}

// ─── Frame Monitor ──────────────────────────────────────────────────────

function FrameMonitorPanel() {
  const { latestFrame, frameHistory, captureFrame, resetJank } = useVisualRuntimeStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Frame Monitor</h3>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void captureFrame()}>
            <RefreshCw className="mr-1 h-3 w-3" />Capture
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void resetJank()}>
            <Trash2 className="mr-1 h-3 w-3" />Reset
          </Button>
        </div>
      </div>
      {latestFrame && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="FPS" value={<span className={latestFrame.fps < 50 ? "text-amber-600" : "text-emerald-600"}>{latestFrame.fps}</span>} />
            <Metric label="Dropped" value={latestFrame.droppedFrames} />
            <Metric label="Avg Frame" value={`${latestFrame.avgFrameDurationMs}ms`} />
            <Metric label="Max Frame" value={`${latestFrame.maxFrameDurationMs}ms`} />
            <Metric label="Jank Count" value={<span className={latestFrame.jankCount > 0 ? "text-amber-600" : ""}>{latestFrame.jankCount}</span>} />
            <Metric label="Janky?" value={latestFrame.isJanky ? <span className="text-rose-600">Yes</span> : <span className="text-emerald-600">No</span>} />
          </div>
          {frameHistory.length > 1 && (
            <Card><CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">FPS History ({frameHistory.length})</h4>
              <div className="flex h-24 items-end gap-0.5">
                {frameHistory.slice(0, 60).reverse().map((f, i) => (
                  <div
                    key={i}
                    className={cn("flex-1 rounded-t", f.fps >= 55 ? "bg-emerald-500" : f.fps >= 45 ? "bg-amber-500" : "bg-rose-500")}
                    style={{ height: `${(f.fps / 60) * 100}%` }}
                    title={`${f.fps} fps`}
                  />
                ))}
              </div>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Performance ────────────────────────────────────────────────────────

function PerformancePanel() {
  const { performance, capturePerformance } = useVisualRuntimeStore();
  React.useEffect(() => { void capturePerformance(); }, [capturePerformance]);
  if (!performance) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Performance Overlay</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void capturePerformance()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Raster" value={`${performance.rasterTimeMs}ms`} />
        <Metric label="UI Thread" value={`${performance.uiThreadTimeMs}ms`} />
        <Metric label="GPU" value={`${performance.gpuTimeMs}ms`} />
        <Metric label="Memory" value={`${performance.memoryMb}MB`} />
      </div>
    </div>
  );
}

// ─── Console ────────────────────────────────────────────────────────────

function ConsolePanel() {
  const { consoleEntries, consoleStats, clearConsole, refreshConsole } = useVisualRuntimeStore();
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border p-2">
        <div className="flex items-center gap-2 text-[10px]">
          {consoleStats && Object.entries(consoleStats).map(([level, count]) => (
            <span key={level} className={cn("font-mono", levelColor(level as ConsoleLevel))}>{level}: {count as number}</span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void refreshConsole()}>
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void clearConsole()}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2 font-mono text-[11px]">
        {consoleEntries.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">No console entries.</p>
        ) : (
          consoleEntries.map((e) => (
            <div key={e.id} className="flex items-start gap-2 py-0.5 hover:bg-muted/30">
              <span className="shrink-0 text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span className={cn("shrink-0 uppercase font-medium", levelColor(e.level))}>{e.level}</span>
              <span className="shrink-0 text-muted-foreground">[{e.source}]</span>
              <span className="text-foreground">{e.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Events ─────────────────────────────────────────────────────────────

function EventsPanel() {
  const { events, simulate, clearEvents } = useVisualRuntimeStore();

  const handleSimulate = async (type: EventType, params: Record<string, unknown> = {}) => {
    await simulate({ type, ...params });
    toast.success(`Simulated ${type}`);
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Events ({events.length})</h3>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => void clearEvents()}>
          <Trash2 className="mr-1 h-3 w-3" />Clear
        </Button>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Simulate Interactions</h4>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleSimulate("tap", { x: 180, y: 400, widget: "ElevatedButton" })}>
            Tap Button
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleSimulate("scroll", { dx: 0, dy: -120 })}>
            Scroll Down
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleSimulate("navigation", { from: "/", to: "/details" })}>
            Navigate to /details
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void handleSimulate("keyboard", { key: "Enter" })}>
            Press Enter
          </Button>
        </div>
      </CardContent></Card>
      {events.length === 0 ? (
        <EmptyState icon={Activity} title="No events" description="Simulate interactions above or interact with a connected device." />
      ) : (
        <div className="space-y-1.5">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              <Badge variant="outline" className="text-[9px] capitalize">{e.type}</Badge>
              <span className="text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
              <span className="ml-auto truncate font-mono text-[10px] text-muted-foreground">{JSON.stringify(e.details)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Vision Context ─────────────────────────────────────────────────────

function VisionContextPanel() {
  const { visionContext, buildVisionContext, connectedDevices, selectedDeviceId } = useVisualRuntimeStore();
  const deviceId = selectedDeviceId ?? connectedDevices[0]?.id ?? "emulator-5554";
  React.useEffect(() => { void buildVisionContext(deviceId); }, [buildVisionContext, deviceId]);
  if (!visionContext) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Vision Context for AI</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void buildVisionContext(deviceId)}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Structured visual context for AI reasoning — current screen, widget tree, layout, runtime state, navigation, device info.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Current Screen</h4>
          <p className="text-sm font-medium text-foreground">{visionContext.currentScreen}</p>
          <p className="text-[10px] text-muted-foreground">{visionContext.deviceInfo.name} · {visionContext.deviceInfo.resolution} · {visionContext.deviceInfo.orientation}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Runtime State</h4>
          <div className="text-xs">
            <div>FPS: <span className="text-foreground">{visionContext.runtimeState.fps}</span></div>
            <div>Jank: <span className="text-foreground">{visionContext.runtimeState.jankCount}</span></div>
            <div>Memory: <span className="text-foreground">{visionContext.runtimeState.memoryMb}MB</span></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Widget Tree Summary</h4>
          <div className="text-xs">
            <div>Total widgets: <span className="text-foreground">{visionContext.widgetTreeSummary.totalWidgets}</span></div>
            <div>Max depth: <span className="text-foreground">{visionContext.widgetTreeSummary.maxDepth}</span></div>
            <div className="mt-1 flex flex-wrap gap-1">
              {visionContext.widgetTreeSummary.topWidgets.map((w) => <Badge key={w} variant="outline" className="text-[9px]">{w}</Badge>)}
            </div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Layout Summary</h4>
          <div className="text-xs">
            <div>Total issues: <span className="text-foreground">{visionContext.layoutSummary.totalIssues}</span></div>
            <div>Overflow: <span className="text-foreground">{visionContext.layoutSummary.overflowCount}</span></div>
          </div>
        </CardContent></Card>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Navigation State</h4>
        <div className="text-xs">
          <div>Current route: <span className="font-mono text-foreground">{visionContext.navigationState.currentRoute}</span></div>
          <div className="mt-1">Stack: {visionContext.navigationState.routeStack.join(" → ")}</div>
        </div>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Full JSON</h4>
        <pre className="ff-scroll max-h-60 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{JSON.stringify(visionContext, null, 2)}</pre>
      </CardContent></Card>
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { metrics, refreshMetrics } = useVisualRuntimeStore();
  if (!metrics) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Visual Runtime Metrics</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshMetrics()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Screenshots" value={metrics.totalScreenshots} />
        <Metric label="Active Streams" value={metrics.totalStreams} />
        <Metric label="Total Connections" value={metrics.totalConnections} />
        <Metric label="Average FPS" value={metrics.averageFps} />
        <Metric label="Jank Count" value={metrics.jankCount} />
        <Metric label="Layout Issues" value={metrics.layoutIssuesFound} />
        <Metric label="Runtime Errors" value={<span className={metrics.runtimeErrors > 0 ? "text-rose-600" : ""}>{metrics.runtimeErrors}</span>} />
      </div>
    </div>
  );
}
