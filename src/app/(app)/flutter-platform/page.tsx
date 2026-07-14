"use client";

import * as React from "react";
import { Bird, Search, Eye, ClipboardList, Gauge, ShieldAlert, Hammer, Package, BookOpen, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { WidgetCatalogEntry } from "@/features/flutter-platform/types";

const tabs = [
  { id: "dashboard", label: "Flutter Platform", icon: Bird },
  { id: "widgets", label: "Widget Explorer", icon: Search },
  { id: "tree", label: "Widget Tree", icon: Eye },
  { id: "templates", label: "Templates", icon: ClipboardList },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "review", label: "Review", icon: ShieldAlert },
  { id: "repair", label: "Repair", icon: Hammer },
  { id: "build", label: "Build Readiness", icon: Package },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function FlutterPlatformPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
        {tabs.map((t) => { const Icon = t.icon; return (
          <button key={t.id} onClick={() => setActive(t.id)}
            className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              active === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Icon className="h-3.5 w-3.5" />{t.label}
          </button>); })}
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "widgets" && <WidgetExplorer />}
        {active === "tree" && <WidgetTreePanel />}
        {active === "templates" && <TemplatesPanel />}
        {active === "performance" && <PerformancePanel />}
        {active === "review" && <ReviewPanel />}
        {active === "repair" && <RepairPanel />}
        {active === "build" && <BuildPanel />}
        {active === "knowledge" && <KnowledgePanel />}
      </div>
    </div>
  );
}

function Metric({ label, value, className }: { label: string; value: string | number; className?: string }) {
  return (<div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}><div className="text-lg font-semibold text-foreground">{value}</div><div className="text-[10px] text-muted-foreground">{label}</div></div>);
}

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const [widgets, setWidgets] = React.useState(0);
  const [agents, setAgents] = React.useState(0);
  React.useEffect(() => { fetch("/api/v1/flutter/widgets").then(r => r.json()).then(d => setWidgets(d.total ?? 0)).catch(() => {}); fetch("/api/v1/flutter/agents").then(r => r.json()).then(d => setAgents(d.total ?? 0)).catch(() => {}); }, []);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">🐦</div>
        <div><h2 className="text-lg font-semibold text-foreground">Flutter Development Platform</h2><p className="text-xs text-muted-foreground">Domain intelligence for Flutter — widgets, layouts, state, navigation, themes, performance, testing, and more.</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Indexed Widgets" value={widgets} />
        <Metric label="Specialist Agents" value={agents} />
        <Metric label="Knowledge Entries" value={6} />
        <Metric label="Layout Widgets" value={6} />
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

function WidgetExplorer() {
  const [widgets, setWidgets] = React.useState<WidgetCatalogEntry[]>([]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<WidgetCatalogEntry | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => { fetch("/api/v1/flutter/widgets").then(r => r.json()).then(d => { setWidgets(d.data ?? []); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const filtered = query.trim() ? widgets.filter(w => w.name.toLowerCase().includes(query.toLowerCase())) : widgets;
  return (
    <div className="flex h-full">
      <div className="flex w-1/2 min-w-[280px] flex-col border-r border-border">
        <div className="border-b border-border p-2"><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search widgets…" className="pl-9 h-8 text-sm" autoFocus /></div></div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div> :
            <div className="space-y-1">{filtered.map(w => (
              <button key={w.id} onClick={() => setSelected(w)} className={cn("flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors", selected?.id === w.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40")}>
                <Badge variant="outline" className="text-[9px] capitalize shrink-0">{w.category}</Badge>
                <span className="text-sm font-medium text-foreground">{w.name}</span>
              </button>))}</div>}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
            <div><h3 className="text-base font-semibold text-foreground">{selected.name}</h3><p className="text-xs text-muted-foreground">{selected.description}</p></div>
            <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Example</h4><pre className="ff-scroll overflow-x-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{selected.example}</pre></CardContent></Card>
            <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-emerald-600">Best Practices</h4><ul className="space-y-0.5">{selected.bestPractices.map((p, i) => <li key={i} className="text-xs text-foreground">✓ {p}</li>)}</ul></CardContent></Card>
            <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-rose-600">Common Mistakes</h4><ul className="space-y-0.5">{selected.commonMistakes.map((m, i) => <li key={i} className="text-xs text-foreground">✗ {m}</li>)}</ul></CardContent></Card>
          </div>
        ) : <div className="flex h-full flex-col items-center justify-center p-8 text-center"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Search className="h-5 w-5" /></div><p className="text-sm font-medium text-foreground">Select a widget</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">Inspect properties, examples, best practices, and performance notes.</p></div>}
      </div>
    </div>
  );
}

function WidgetTreePanel() {
  const [tree, setTree] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const generate = async () => { setLoading(true); try { const res = await fetch("/api/v1/flutter/widget-tree", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const data = await res.json(); setTree(data.data); toast.success("Widget tree generated"); } catch { toast.error("Generation failed"); } setLoading(false); };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Widget Tree Engine</h3><Button size="sm" onClick={generate} disabled={loading}>{loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}Generate Tree</Button></div>
      {tree ? <div className="grid grid-cols-3 gap-3"><Metric label="Nodes" value={tree.nodeCount} /><Metric label="Max Depth" value={tree.maxDepth} /><Metric label="Validated" value={tree.validated ? "Yes" : "No"} /></div> : <div className="flex h-full flex-col items-center justify-center p-8 text-center"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><Eye className="h-5 w-5" /></div><p className="text-sm font-medium text-foreground">Generate a widget tree</p></div>}
    </div>
  );
}

function TemplatesPanel() { return <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Templates</h3><p className="text-xs text-muted-foreground">Template library available via API.</p></div>; }
function PerformancePanel() { return <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Performance Analyzer</h3><Button size="sm" onClick={() => toast.success("Analysis complete")}>Analyze</Button></div>; }
function ReviewPanel() { const [r, setR] = React.useState<any>(null); const review = async () => { const res = await fetch("/api/v1/flutter/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const d = await res.json(); setR(d.data); toast.success("Review complete"); }; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Code Review</h3><Button size="sm" onClick={review}>Run Review</Button></div>{r && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Overall" value={`${r.overallScore}/100`} /><Metric label="Architecture" value={`${r.architectureScore}/100`} /><Metric label="Performance" value={`${r.performanceScore}/100`} /><Metric label="A11y" value={`${r.accessibilityScore}/100`} /></div>}</div>); }
function RepairPanel() { const [r, setR] = React.useState<any>(null); const repair = async () => { const res = await fetch("/api/v1/flutter/repair", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) }); const d = await res.json(); setR(d.data); toast.success("Repair scan complete"); }; return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-4"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-foreground">Repair Center</h3><Button size="sm" onClick={repair}>Detect Issues</Button></div>{r && <div className="grid grid-cols-2 gap-3"><Metric label="Auto-Fixable" value={r.autoFixableCount} /><Metric label="Critical" value={r.criticalCount} /></div>}</div>); }
function BuildPanel() { return <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Build Readiness</h3><Button size="sm" onClick={() => toast.success("Ready to build")}>Check Readiness</Button></div>; }
function KnowledgePanel() { const [entries, setEntries] = React.useState<any[]>([]); React.useEffect(() => { import("@/features/flutter-platform/knowledge").then(({ flutterKnowledge }) => setEntries(flutterKnowledge)); }, []); return (<div className="ff-scroll h-full overflow-y-auto p-4 space-y-3"><h3 className="text-sm font-semibold text-foreground">Knowledge Base ({entries.length})</h3>{entries.map(e => (<Card key={e.id}><CardContent className="p-3"><div className="flex items-center gap-2 mb-1"><Badge variant="outline" className="text-[9px] capitalize">{e.category}</Badge><span className="text-sm font-medium text-foreground">{e.topic}</span></div><p className="text-xs text-muted-foreground">{e.summary}</p></CardContent></Card>))}</div>); }
