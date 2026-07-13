"use client";

import * as React from "react";
import {
  Activity, Boxes, ShieldCheck, History, GitCompare, Eye, Undo2, BarChart3,
  Play, Check, X, Clock, AlertTriangle, Loader2, Search, RefreshCw, Terminal,
  Cpu, Zap, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RiskBadge, StatusBadge, CategoryBadge, DiffViewer, Metric, EmptyState } from "@/components/execution/shared";
import { useExecutionStore, useToolStore, useHistoryStore, useApprovalStore, useQueueStore } from "@/stores";
import { createRequest } from "@/features/execution/core";
import type { ToolDescriptor, ToolCategory, HistoryEntry, ApprovalRequest } from "@/features/execution/types";
import { toast } from "sonner";

const tabs = [
  { id: "center", label: "Execution Center", icon: Activity },
  { id: "tools", label: "Tool Explorer", icon: Boxes },
  { id: "approvals", label: "Approval Queue", icon: ShieldCheck },
  { id: "history", label: "History", icon: History },
  { id: "diff", label: "Diff Viewer", icon: GitCompare },
  { id: "rollback", label: "Rollback", icon: Undo2 },
  { id: "telemetry", label: "Telemetry", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ExecutionPage() {
  const [active, setActive] = React.useState<TabId>("center");
  const hydrateTools = useToolStore((s) => s.hydrate);
  const hydrateHistory = useHistoryStore((s) => s.hydrate);
  const hydrateQueue = useQueueStore((s) => s.hydrate);

  React.useEffect(() => {
    hydrateTools();
    hydrateHistory();
    hydrateQueue();
  }, [hydrateTools, hydrateHistory, hydrateQueue]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                active === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        {active === "center" && <ExecutionCenter />}
        {active === "tools" && <ToolExplorer />}
        {active === "approvals" && <ApprovalQueue />}
        {active === "history" && <HistoryView />}
        {active === "diff" && <DiffViewerTab />}
        {active === "rollback" && <RollbackManager />}
        {active === "telemetry" && <TelemetryDashboard />}
      </div>
    </div>
  );
}

// ─── Execution Center ───────────────────────────────────────────────────

function ExecutionCenter() {
  const { executions, execute, loading } = useExecutionStore();
  const queueStats = useQueueStore((s) => s.stats);

  const all = Object.values(executions);
  const running = all.filter((e) => e.result?.status === "running" || (!e.result && e.request));
  const queued = all.filter((e) => e.result?.status === "queued");
  const completed = all.filter((e) => e.result?.status === "success");
  const failed = all.filter((e) => e.result?.status === "failed");
  const pending = all.filter((e) => e.result?.status === "pending-approval");

  // Quick-execute a safe tool.
  const [toolId, setToolId] = React.useState("fs.list_directory");
  const [path, setPath] = React.useState(".");

  const runTool = async () => {
    try {
      const req = createRequest({
        toolId,
        parameters: toolId === "fs.list_directory" || toolId === "fs.read_file" ? { path } : {},
      });
      const result = await execute(req);
      if (result.status === "success") toast.success(`${toolId} completed`);
      else if (result.status === "pending-approval") toast.info("Approval required");
      else toast.error(result.error || "Failed");
    } catch {
      /* handled by store */
    }
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Metric label="Running" value={running.length} />
        <Metric label="Queued" value={queued.length} />
        <Metric label="Pending Approval" value={pending.length} />
        <Metric label="Completed" value={completed.length} />
        <Metric label="Failed" value={failed.length} />
        <Metric label="Queue Mode" value="Sequential" />
      </div>

      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Play className="h-3.5 w-3.5" /> Quick Execute
          </h4>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={toolId} onValueChange={setToolId}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fs.list_directory">📁 List Directory</SelectItem>
                <SelectItem value="fs.read_file">📄 Read File</SelectItem>
                <SelectItem value="fs.write_file">✏️ Write File (moderate)</SelectItem>
                <SelectItem value="fs.create_file">➕ Create File (moderate)</SelectItem>
                <SelectItem value="fs.delete_file">🗑️ Delete File (high)</SelectItem>
                <SelectItem value="search.find_symbol">🔍 Find Symbol</SelectItem>
              </SelectContent>
            </Select>
            {(toolId === "fs.list_directory" || toolId === "fs.read_file") && (
              <Input value={path} onChange={(e) => setPath(e.target.value)} placeholder="path" className="w-full sm:w-48" />
            )}
            <Button onClick={runTool} disabled={loading} size="sm">
              {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1 h-3.5 w-3.5" />}
              Execute
            </Button>
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            Moderate/High/Critical tools require approval. Try “Write File” to see the approval flow.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Activity className="h-3.5 w-3.5" /> Recent Executions
          </h4>
          {all.length === 0 ? (
            <EmptyState icon={Activity} title="No executions yet" description="Run a tool to see it here." />
          ) : (
            <div className="space-y-1.5">
              {all.slice(0, 20).map(({ request, result }) => (
                <ExecutionRow key={request.id} request={request} result={result} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ExecutionRow({ request, result }: { request: any; result?: any }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs">
      <span className="font-mono text-foreground">{request.toolId}</span>
      {result ? <StatusBadge status={result.status} /> : <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
      {result?.durationMs !== undefined && (
        <span className="text-[10px] text-muted-foreground">{result.durationMs}ms</span>
      )}
      <span className="ml-auto truncate text-[10px] text-muted-foreground">
        {new Date(request.createdAt).toLocaleTimeString()}
      </span>
    </div>
  );
}

// ─── Tool Explorer ──────────────────────────────────────────────────────

function ToolExplorer() {
  const { tools, hydrate, query, setQuery, categoryFilter, setCategoryFilter, filtered, loading } = useToolStore();
  const [selected, setSelected] = React.useState<ToolDescriptor | null>(null);

  React.useEffect(() => { if (tools.length === 0) hydrate(); }, [tools.length, hydrate]);

  const categories: Array<ToolCategory | "all"> = ["all", "filesystem", "editor", "search", "flutter", "git", "terminal"];

  return (
    <div className="flex h-full">
      <div className="flex w-1/2 min-w-[300px] flex-col border-r border-border">
        <div className="border-b border-border p-3 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search tools…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategoryFilter(c)}
                className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors capitalize",
                  categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {loading && tools.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading tools…</div>
          ) : (
            <div className="space-y-1">
              {filtered().map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={cn("flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors",
                    selected?.id === t.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40")}
                >
                  <span className="text-lg">{t.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{t.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{t.id}</div>
                  </div>
                  <RiskBadge level={t.riskLevel} />
                  {!t.implemented && <Badge variant="outline" className="text-[9px]">stub</Badge>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? <ToolDetail tool={selected} /> : <EmptyState icon={Boxes} title="Select a tool" description="Inspect parameters, permissions, and risk level." />}
      </div>
    </div>
  );
}

function ToolDetail({ tool }: { tool: ToolDescriptor }) {
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{tool.icon}</span>
        <div>
          <h3 className="text-base font-semibold text-foreground">{tool.name}</h3>
          <p className="text-xs text-muted-foreground">{tool.id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <RiskBadge level={tool.riskLevel} />
          <CategoryBadge category={tool.category} />
          {tool.implemented ? (
            <Badge variant="outline" className="text-[9px] text-emerald-600">implemented</Badge>
          ) : (
            <Badge variant="outline" className="text-[9px] text-amber-600">stub</Badge>
          )}
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{tool.description}</p>

      <Card>
        <CardContent className="p-4">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Parameters</h4>
          {tool.parameters.length === 0 ? (
            <p className="text-xs text-muted-foreground">No parameters.</p>
          ) : (
            <div className="space-y-1.5">
              {tool.parameters.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-foreground">{p.name}</span>
                  <Badge variant="outline" className="text-[9px]">{p.type}</Badge>
                  {p.required && <Badge variant="outline" className="text-[9px] text-rose-600">required</Badge>}
                  <span className="truncate text-muted-foreground">{p.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Permissions</h4>
          <div className="flex flex-wrap gap-1">
            {tool.permissions.length === 0 ? <span className="text-xs text-muted-foreground">None</span> :
              tool.permissions.map((p) => <Badge key={p} variant="outline" className="text-[9px] font-mono">{p}</Badge>)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Properties</h4>
          <div className="space-y-0.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Timeout</span><span className="text-foreground">{(tool.timeoutMs / 1000).toFixed(0)}s</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rollback</span><span className="text-foreground">{tool.supportsRollback ? "✓" : "✗"}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Preview</span><span className="text-foreground">{tool.supportsPreview ? "✓" : "✗"}</span></div>
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}

// ─── Approval Queue ─────────────────────────────────────────────────────

function ApprovalQueue() {
  const { hydrate, approve, reject } = useApprovalStore();
  const [approvals, setApprovals] = React.useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/execution/history");
      const data = await res.json();
      setApprovals(data.pendingApprovals ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  React.useEffect(() => { refresh(); void hydrate; }, [hydrate]);

  const handleApprove = async (requestId: string) => {
    await fetch("/api/v1/execution/approve", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
    toast.success("Approved");
    refresh();
  };
  const handleReject = async (requestId: string) => {
    await fetch("/api/v1/execution/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ requestId }) });
    toast.success("Rejected");
    refresh();
  };

  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pending Approvals ({pending.length})</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>
      ) : pending.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No pending approvals" description="Moderate, High, and Critical tool executions will appear here for approval." />
      ) : (
        <div className="space-y-2">
          {pending.map((a) => (
            <Card key={a.id}><CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-foreground">{a.toolName}</span>
                <RiskBadge level={a.riskLevel} />
                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(a.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{a.reason}</p>
              <div className="rounded-md bg-muted/30 p-2 mb-3">
                <pre className="text-[10px] font-mono text-foreground overflow-x-auto">{JSON.stringify(a.parameters, null, 2)}</pre>
              </div>
              {a.patch && (
                <div className="mb-3">
                  <h5 className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Patch Preview</h5>
                  <DiffViewer patch={a.patch} mode="inline" />
                </div>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleApprove(a.requestId)}><Check className="mr-1 h-3.5 w-3.5" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleReject(a.requestId)}><X className="mr-1 h-3.5 w-3.5" />Reject</Button>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryView() {
  const { entries, hydrate, loading, categoryFilter, statusFilter, setCategoryFilter, setStatusFilter, filtered } = useHistoryStore();

  React.useEffect(() => { if (entries.length === 0) hydrate(); }, [entries.length, hydrate]);

  const categories: Array<ToolCategory | "all"> = ["all", "filesystem", "editor", "search", "flutter", "git", "terminal"];
  const statuses = ["all", "success", "failed", "pending-approval", "rolled-back"];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3 space-y-2">
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategoryFilter(c)}
              className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{c}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {statuses.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s as any)}
              className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors",
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{s}</button>
          ))}
        </div>
      </div>
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {loading && entries.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>
        ) : filtered().length === 0 ? (
          <EmptyState icon={History} title="No history" description="Executed tools will appear here." />
        ) : (
          <div className="space-y-1.5">
            {filtered().map((e) => <HistoryRow key={e.id} entry={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  return (
    <div className="rounded-md border border-border/60 bg-card p-2.5 text-xs">
      <div className="flex items-center gap-2 mb-1">
        <StatusBadge status={entry.status} />
        <CategoryBadge category={entry.category} />
        <RiskBadge level={entry.riskLevel} />
        <span className="font-medium text-foreground">{entry.toolName}</span>
        <span className="ml-auto text-[10px] text-muted-foreground">{new Date(entry.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
        <span>⏱ {entry.durationMs}ms</span>
        <span>by {entry.initiatedBy}{entry.agentId ? ` (${entry.agentId})` : ""}</span>
        {entry.error && <span className="text-rose-600 dark:text-rose-400">⚠ {entry.error}</span>}
      </div>
    </div>
  );
}

// ─── Diff Viewer ────────────────────────────────────────────────────────

function DiffViewerTab() {
  const [before, setBefore] = React.useState("Hello world\nThis is line 2\nThis is line 3");
  const [after, setAfter] = React.useState("Hello FlutterForge\nThis is line 2\nThis is a new line\nThis is line 3");
  const [mode, setMode] = React.useState<"inline" | "split">("inline");
  const [patch, setPatch] = React.useState<any>(null);

  const generate = async () => {
    const res = await fetch("/api/v1/execution/execute", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toolId: "fs.write_file", parameters: { path: "__diff_preview__", content: after }, skipApproval: true }),
    });
    void res;
    // Build the patch locally for preview.
    const { computeDiff } = await import("@/features/execution/diff");
    const { hunks, diff } = computeDiff(before, after);
    setPatch({ id: "preview", path: "preview.txt", before, after, diff, hunks, applied: false, partial: hunks.length > 1 });
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Diff Viewer</h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMode("inline")} className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", mode === "inline" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Inline</button>
          <button onClick={() => setMode("split")} className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium", mode === "split" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>Split</button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Before</label>
          <textarea value={before} onChange={(e) => setBefore(e.target.value)} rows={5} className="w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-xs" />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">After</label>
          <textarea value={after} onChange={(e) => setAfter(e.target.value)} rows={5} className="w-full resize-none rounded-md border border-border bg-background p-2 font-mono text-xs" />
        </div>
      </div>
      <Button onClick={generate} size="sm"><GitCompare className="mr-1 h-3.5 w-3.5" />Generate Diff</Button>
      {patch && <DiffViewer patch={patch} mode={mode} />}
    </div>
  );
}

// ─── Rollback Manager ───────────────────────────────────────────────────

function RollbackManager() {
  const [snapshots, setSnapshots] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/execution/rollback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "list" }) });
      const data = await res.json();
      setSnapshots(data.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  React.useEffect(() => { refresh(); }, []);

  const restore = async (snapshotId: string) => {
    await fetch("/api/v1/execution/rollback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restore", snapshotId }) });
    toast.success("Snapshot restored");
    refresh();
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Snapshots ({snapshots.length})</h3>
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={refresh}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>
      ) : snapshots.length === 0 ? (
        <EmptyState icon={Undo2} title="No snapshots" description="Snapshots are created when rollback-supported tools execute (e.g., Delete File, Rename File)." />
      ) : (
        <div className="space-y-1.5">
          {snapshots.map((s) => (
            <div key={s.id} className="rounded-md border border-border/60 bg-card p-2.5 text-xs">
              <div className="flex items-center gap-2 mb-1">
                <Undo2 className="h-3 w-3 text-violet-500" />
                <span className="font-mono text-foreground">{s.path}</span>
                {s.restored && <Badge variant="outline" className="text-[9px] text-violet-600">restored</Badge>}
                <span className="ml-auto text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleTimeString()}</span>
              </div>
              <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => restore(s.id)}><Undo2 className="mr-1 h-3 w-3" />Restore</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Telemetry Dashboard ────────────────────────────────────────────────

function TelemetryDashboard() {
  const [tools, setTools] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/v1/execution/tools").then((r) => r.json()).then((d) => {
      setTools(d.data?.filter((t: any) => t.telemetry?.executionCount > 0) ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalExec = tools.reduce((s, t) => s + t.telemetry.executionCount, 0);
  const totalSuccess = tools.reduce((s, t) => s + t.telemetry.successCount, 0);
  const totalFail = tools.reduce((s, t) => s + t.telemetry.failureCount, 0);
  const avgDur = totalExec > 0 ? Math.round(tools.reduce((s, t) => s + t.telemetry.totalDurationMs, 0) / totalExec) : 0;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Executions" value={totalExec} />
        <Metric label="Successes" value={totalSuccess} />
        <Metric label="Failures" value={totalFail} />
        <Metric label="Avg Duration" value={`${avgDur}ms`} />
      </div>
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tool Usage</h4>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div>
          ) : tools.length === 0 ? (
            <EmptyState icon={BarChart3} title="No telemetry yet" description="Execute tools to see usage statistics." />
          ) : (
            <div className="space-y-1.5">
              {tools.sort((a, b) => b.telemetry.executionCount - a.telemetry.executionCount).map((t) => (
                <div key={t.id} className="flex items-center gap-2 rounded-md border border-border/60 p-2 text-xs">
                  <span className="text-lg">{t.icon}</span>
                  <span className="font-medium text-foreground">{t.name}</span>
                  <Badge variant="outline" className="text-[9px]">{t.telemetry.executionCount} runs</Badge>
                  <Badge variant="outline" className="text-[9px] text-emerald-600">{(t.telemetry.successRate * 100).toFixed(0)}% success</Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">avg {t.telemetry.averageDurationMs}ms</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

void Terminal; void Cpu; void Zap; void Clock; void Eye; void Separator;
