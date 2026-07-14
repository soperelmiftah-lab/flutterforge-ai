"use client";

import * as React from "react";
import {
  Bird, Search, Eye, ClipboardList, Gauge, ShieldAlert, Hammer,
  Package, BookOpen, Loader2, Sparkles, Wand2, Copy, Save, CheckCircle2,
  type LucideIcon,
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
import { useFlutterPlatformStore } from "@/stores";
import type { WidgetCatalogEntry } from "@/features/flutter-platform/types";
import type { ReviewResult, RepairResult, ReviewSeverity } from "@/features/flutter-platform/types";
import type { PerformanceReport } from "@/features/flutter-platform/types";
import type { FlutterTemplateWithFiles } from "@/features/flutter-platform/templates";
import { flutterKnowledge } from "@/features/flutter-platform/knowledge";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Flutter Platform", icon: Bird },
  { id: "generator", label: "Generator", icon: Sparkles },
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
  const fetchTemplates = useFlutterPlatformStore((s) => s.fetchTemplates);
  const checkBuild = useFlutterPlatformStore((s) => s.checkBuild);

  React.useEffect(() => {
    void fetchTemplates();
    void checkBuild();
  }, [fetchTemplates, checkBuild]);

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
        {active === "generator" && <GeneratorPanel />}
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

function severityColor(s: ReviewSeverity): string {
  switch (s) {
    case "info": return "text-sky-600 dark:text-sky-400";
    case "warning": return "text-amber-600 dark:text-amber-400";
    case "error": return "text-rose-600 dark:text-rose-400";
    case "critical": return "text-rose-700 dark:text-rose-300";
  }
}

function severityBadgeClass(s: ReviewSeverity): string {
  switch (s) {
    case "info": return "text-sky-600";
    case "warning": return "text-amber-600";
    case "error": return "text-rose-600";
    case "critical": return "text-rose-700";
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const [widgets, setWidgets] = React.useState(0);
  const [agents, setAgents] = React.useState(0);
  const [packages, setPackages] = React.useState(0);
  const templates = useFlutterPlatformStore((s) => s.templates);

  React.useEffect(() => {
    fetch("/api/v1/flutter/widgets").then(r => r.json()).then(d => setWidgets(d.total ?? 0)).catch(() => {});
    fetch("/api/v1/flutter/agents").then(r => r.json()).then(d => setAgents(d.total ?? 0)).catch(() => {});
    fetch("/api/v1/flutter/packages").then(r => r.json()).then(d => setPackages(d.total ?? 0)).catch(() => {});
  }, []);

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">🐦</div>
        <div><h2 className="text-lg font-semibold text-foreground">Flutter Development Platform</h2><p className="text-xs text-muted-foreground">AI-powered code generation, review, repair, and scaffolding — all backed by the Forge chat engine and Execution Engine.</p></div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Indexed Widgets" value={widgets} />
        <Metric label="Specialist Agents" value={agents} />
        <Metric label="Templates" value={templates.length} />
        <Metric label="Packages" value={packages} />
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

// ─── AI Generator Panel (NEW) ───────────────────────────────────────────

function GeneratorPanel() {
  const {
    description, setDescription, mode, setMode, className, setClassName,
    generation, generating, generate, saveToWorkspace, saving, saveResult,
  } = useFlutterPlatformStore();
  const [copied, setCopied] = React.useState(false);

  const handleGenerate = async () => {
    if (!description.trim()) {
      toast.error("Enter a description first");
      return;
    }
    toast.info("Generating Dart code…");
    await generate();
    const gen = useFlutterPlatformStore.getState().generation;
    if (gen) {
      toast.success(gen.aiGenerated ? "AI generated the code" : "Template fallback used");
    }
  };

  const handleCopy = async () => {
    if (!generation) return;
    try {
      await navigator.clipboard.writeText(generation.code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed");
    }
  };

  const handleSave = async () => {
    if (!generation) return;
    toast.info(`Saving to ${generation.suggestedPath}…`);
    await saveToWorkspace(generation.suggestedPath, generation.code);
    const r = useFlutterPlatformStore.getState().saveResult;
    if (r?.status === "success") {
      toast.success(`Saved to ${generation.suggestedPath}`);
    } else {
      toast.error(`Save failed: ${r?.error ?? "unknown error"}`);
    }
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" /> AI Dart Code Generator
          </h4>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !generating && handleGenerate()}
            placeholder="Describe what to generate… (e.g. 'Login screen with email and password')"
            className="mb-2"
            autoFocus
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="screen">Screen</SelectItem>
                <SelectItem value="widget">Widget</SelectItem>
                <SelectItem value="model">Model</SelectItem>
                <SelectItem value="service">Service</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="ClassName (optional — derived from description)"
              className="flex-1"
            />
            <Button onClick={handleGenerate} disabled={generating || !description.trim()}>
              {generating ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />}
              Generate
            </Button>
          </div>
        </CardContent>
      </Card>

      {generation && (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[9px] capitalize">{generation.mode}</Badge>
            <Badge variant="outline" className="text-[9px] font-mono">{generation.className}</Badge>
            {generation.aiGenerated ? (
              <Badge variant="outline" className="text-[9px] text-violet-600 dark:text-violet-400">✨ AI-generated</Badge>
            ) : (
              <Badge variant="outline" className="text-[9px] text-muted-foreground">Template fallback</Badge>
            )}
            <span className="text-[10px] text-muted-foreground">{generation.lineCount} lines · {generation.suggestedPath}</span>
            <div className="ml-auto flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleCopy} disabled={!generation.code}>
                {copied ? <CheckCircle2 className="mr-1 h-3 w-3 text-emerald-600" /> : <Copy className="mr-1 h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleSave} disabled={saving || !generation.code}>
                {saving ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Save className="mr-1 h-3 w-3" />}
                Save to Workspace
              </Button>
            </div>
          </div>

          {generation.rationale && (
            <Card><CardContent className="p-3">
              <p className="text-xs text-foreground leading-relaxed">{generation.rationale}</p>
            </CardContent></Card>
          )}

          <Card>
            <CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Generated Dart Code</h4>
              <pre className="ff-scroll max-h-[60vh] overflow-auto rounded bg-muted/30 p-3 text-[11px] font-mono text-foreground whitespace-pre">
{generation.code}
              </pre>
            </CardContent>
          </Card>

          {saveResult && (
            <Card><CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", saveResult.status === "success" ? "text-emerald-600" : "text-rose-600")}>
                  {saveResult.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Saved in {saveResult.durationMs}ms via the Execution Engine
                </span>
              </div>
            </CardContent></Card>
          )}
        </>
      )}

      {!generation && !generating && (
        <EmptyState icon={Sparkles} title="Generate Flutter code with AI"
          description="Describe what you need — a screen, widget, model, or service — and the AI will write production-ready Dart. Save it to the workspace with one click." />
      )}
    </div>
  );
}

// ─── Widget Explorer (uses real catalog) ─────────────────────────────────

function WidgetExplorer() {
  const [widgets, setWidgets] = React.useState<WidgetCatalogEntry[]>([]);
  const [query, setQuery] = React.useState("");
  const [selected, setSelected] = React.useState<WidgetCatalogEntry | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    fetch("/api/v1/flutter/widgets")
      .then(r => r.json())
      .then(d => { setWidgets(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);
  const filtered = query.trim()
    ? widgets.filter(w => w.name.toLowerCase().includes(query.toLowerCase()) || w.description.toLowerCase().includes(query.toLowerCase()))
    : widgets;
  return (
    <div className="flex h-full">
      <div className="flex w-1/2 min-w-[280px] flex-col border-r border-border">
        <div className="border-b border-border p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search widgets…" className="pl-9 h-8 text-sm" autoFocus />
          </div>
        </div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-1">
              {filtered.map(w => (
                <button key={w.id} onClick={() => setSelected(w)} className={cn("flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors", selected?.id === w.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40")}>
                  <Badge variant="outline" className="text-[9px] capitalize shrink-0">{w.category}</Badge>
                  <span className="text-sm font-medium text-foreground">{w.name}</span>
                </button>
              ))}
              {filtered.length === 0 && <p className="p-2 text-xs text-muted-foreground">No widgets match.</p>}
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
              <p className="text-xs text-muted-foreground">{selected.description}</p>
              <p className="mt-1 text-[10px] font-mono text-muted-foreground">{selected.constructorSignature}</p>
            </div>
            <Card><CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Example</h4>
              <pre className="ff-scroll overflow-x-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre-wrap">{selected.example}</pre>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-emerald-600">Best Practices</h4>
              <ul className="space-y-0.5">{selected.bestPractices.map((p, i) => <li key={i} className="text-xs text-foreground">✓ {p}</li>)}</ul>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-rose-600">Common Mistakes</h4>
              <ul className="space-y-0.5">{selected.commonMistakes.map((m, i) => <li key={i} className="text-xs text-foreground">✗ {m}</li>)}</ul>
            </CardContent></Card>
            <Card><CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-amber-600">Performance Notes</h4>
              <ul className="space-y-0.5">{selected.performanceNotes.map((p, i) => <li key={i} className="text-xs text-foreground">⚡ {p}</li>)}</ul>
            </CardContent></Card>
          </div>
        ) : (
          <EmptyState icon={Search} title="Select a widget"
            description="Inspect properties, examples, best practices, and performance notes." />
        )}
      </div>
    </div>
  );
}

// ─── Widget Tree Panel (uses real builder) ───────────────────────────────

function WidgetTreePanel() {
  const [tree, setTree] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/flutter/widget-tree", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateDart: true }),
      });
      const data = await res.json();
      setTree(data.data);
      toast.success("Widget tree generated");
    } catch {
      toast.error("Generation failed");
    }
    setLoading(false);
  };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Widget Tree Engine</h3>
        <Button size="sm" onClick={generate} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : null}
          Generate Tree
        </Button>
      </div>
      {tree && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Nodes" value={tree.nodeCount} />
            <Metric label="Max Depth" value={tree.maxDepth} />
            <Metric label="Validated" value={tree.validated ? "Yes" : "No"} />
          </div>
          {tree.warnings?.length > 0 && (
            <Card><CardContent className="p-3">
              <h4 className="mb-1 text-[10px] font-semibold uppercase text-amber-600">Warnings ({tree.warnings.length})</h4>
              <ul className="space-y-0.5">{tree.warnings.map((w: string, i: number) => <li key={i} className="text-xs text-amber-600 dark:text-amber-400">⚠ {w}</li>)}</ul>
            </CardContent></Card>
          )}
          {tree.generatedDart && (
            <Card><CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Generated Dart</h4>
              <pre className="ff-scroll max-h-80 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre">{tree.generatedDart}</pre>
            </CardContent></Card>
          )}
        </>
      )}
      {!tree && !loading && (
        <EmptyState icon={Eye} title="Generate a widget tree"
          description="Build a default widget tree, validate it, and emit Dart code." />
      )}
    </div>
  );
}

// ─── Templates Panel (real templates + scaffold) ─────────────────────────

function TemplatesPanel() {
  const { templates, scaffold, scaffolding, scaffoldResult } = useFlutterPlatformStore();
  const [selected, setSelected] = React.useState<FlutterTemplateWithFiles | null>(null);

  const handleScaffold = async (t: FlutterTemplateWithFiles) => {
    toast.info(`Scaffolding ${t.name}…`);
    await scaffold(t.id);
    const r = useFlutterPlatformStore.getState().scaffoldResult;
    if (r && r.length > 0) {
      const ok = r.filter(x => x.result.status === "success").length;
      toast.success(`Scaffolded ${ok}/${r.length} files via Execution Engine`);
    }
  };

  if (templates.length === 0) {
    return <EmptyState icon={ClipboardList} title="Loading templates…" />;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Templates ({templates.length})</h3>
      <p className="text-xs text-muted-foreground">Click a template to scaffold it into the workspace. Files are written via the Execution Engine.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <Card key={t.id} className={cn("transition-all", selected?.id === t.id ? "border-primary" : "hover:border-primary/40")}>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-xl">{t.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-foreground">{t.name}</div>
                  <div className="text-[10px] text-muted-foreground">{t.category} · {t.estimatedComplexity}</div>
                </div>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{t.description}</p>
              <div className="mb-3 flex flex-wrap gap-1">
                {t.screens.map((s) => <Badge key={s} variant="outline" className="text-[9px]">{s}</Badge>)}
              </div>
              <div className="mb-3 text-[10px] text-muted-foreground">
                {t.files.length} file(s) · {t.files.reduce((sum, f) => sum + f.content.split("\n").length, 0)} lines
              </div>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelected(t)}>
                  <Eye className="mr-1 h-3 w-3" />Preview
                </Button>
                <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleScaffold(t)} disabled={scaffolding}>
                  {scaffolding ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Hammer className="mr-1 h-3 w-3" />}
                  Scaffold
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card><CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground">{selected.name} — Files</h4>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelected(null)}>Close</Button>
          </div>
          <div className="space-y-2">
            {selected.files.map((f) => (
              <div key={f.path}>
                <div className="mb-1 font-mono text-[10px] text-muted-foreground">{f.path} · {f.content.split("\n").length} lines</div>
                <pre className="ff-scroll max-h-60 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-foreground whitespace-pre">{f.content}</pre>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}

      {scaffoldResult && scaffoldResult.length > 0 && (
        <Card><CardContent className="p-4">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Scaffold Result</h4>
          <div className="space-y-1">
            {scaffoldResult.map((r) => (
              <div key={r.path} className="flex items-center gap-2 text-xs">
                {r.result.status === "success" ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <ShieldAlert className="h-3 w-3 text-rose-600" />}
                <span className="font-mono text-foreground">{r.path}</span>
                <Badge variant="outline" className={cn("text-[9px]", r.result.status === "success" ? "text-emerald-600" : "text-rose-600")}>{r.result.status}</Badge>
                <span className="text-[10px] text-muted-foreground">{r.result.durationMs}ms</span>
                {r.result.error && <span className="text-[10px] text-rose-600">{r.result.error}</span>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Performance Panel (AI) ──────────────────────────────────────────────

function PerformancePanel() {
  const { perfCode, setPerfCode, performance, analyzingPerf, runPerformance } = useFlutterPlatformStore();

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">AI Performance Analyzer</h3>
        <Button size="sm" onClick={runPerformance} disabled={analyzingPerf || !perfCode.trim()}>
          {analyzingPerf ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Gauge className="mr-1 h-3.5 w-3.5" />}
          Analyze
        </Button>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Paste Dart code to analyze</h4>
        <textarea
          value={perfCode}
          onChange={(e) => setPerfCode(e.target.value)}
          className="ff-scroll h-40 w-full resize-y rounded border border-border/60 bg-card p-2 font-mono text-[11px] text-foreground outline-none focus:border-primary"
          placeholder="Paste your Dart/Flutter code here…"
        />
      </CardContent></Card>

      {performance && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Overall" value={<span className={scoreColor(performance.overallScore)}>{performance.overallScore}/100</span>} />
            <Metric label="Rebuild" value={<span className={scoreColor(performance.rebuildScore)}>{performance.rebuildScore}/100</span>} />
            <Metric label="Const Usage" value={<span className={scoreColor(performance.constUsageScore)}>{performance.constUsageScore}/100</span>} />
            <Metric label="Memory" value={<span className={scoreColor(performance.memoryScore)}>{performance.memoryScore}/100</span>} />
          </div>
          {performance.issues.length > 0 && (
            <Card><CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Issues ({performance.issues.length})</h4>
              <div className="space-y-2">
                {performance.issues.map((i) => (
                  <div key={i.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="outline" className={cn("text-[9px] capitalize", severityBadgeClass(i.severity))}>{i.severity}</Badge>
                      <Badge variant="outline" className="text-[9px]">{i.category}</Badge>
                      <Badge variant="outline" className="text-[9px] capitalize">{i.impact} impact</Badge>
                      <span className="font-medium text-foreground">{i.title}</span>
                    </div>
                    <p className="text-muted-foreground">{i.description}</p>
                    <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {i.suggestion}</p>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
          {performance.suggestions.length > 0 && (
            <Card><CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Suggestions</h4>
              <ul className="space-y-1">{performance.suggestions.map((s, i) => <li key={i} className="text-xs text-foreground">⚡ {s}</li>)}</ul>
            </CardContent></Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Review Panel (AI) ───────────────────────────────────────────────────

function ReviewPanel() {
  const { reviewCode, setReviewCode, review, reviewing, runReview } = useFlutterPlatformStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">AI Code Review</h3>
        <Button size="sm" onClick={runReview} disabled={reviewing || !reviewCode.trim()}>
          {reviewing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <ShieldAlert className="mr-1 h-3.5 w-3.5" />}
          Run Review
        </Button>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Paste Dart code to review</h4>
        <textarea
          value={reviewCode}
          onChange={(e) => setReviewCode(e.target.value)}
          className="ff-scroll h-40 w-full resize-y rounded border border-border/60 bg-card p-2 font-mono text-[11px] text-foreground outline-none focus:border-primary"
          placeholder="Paste your Dart/Flutter code here…"
        />
      </CardContent></Card>
      {review && <ReviewResults review={review} />}
    </div>
  );
}

function ReviewResults({ review }: { review: ReviewResult }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Overall" value={<span className={scoreColor(review.overallScore)}>{review.overallScore}/100</span>} />
        <Metric label="Architecture" value={<span className={scoreColor(review.architectureScore)}>{review.architectureScore}</span>} />
        <Metric label="Performance" value={<span className={scoreColor(review.performanceScore)}>{review.performanceScore}</span>} />
        <Metric label="A11y" value={<span className={scoreColor(review.accessibilityScore)}>{review.accessibilityScore}</span>} />
        <Metric label="Maintain" value={<span className={scoreColor(review.maintainabilityScore)}>{review.maintainabilityScore}</span>} />
      </div>
      {review.summary && <p className="text-xs text-muted-foreground">{review.summary}</p>}
      {review.findings.length > 0 ? (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Findings ({review.findings.length})</h4>
          <div className="max-h-96 space-y-2 overflow-y-auto ff-scroll">
            {review.findings.map((f) => (
              <div key={f.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", severityBadgeClass(f.severity))}>{f.severity}</Badge>
                  <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
                  {f.line !== undefined && <Badge variant="outline" className="text-[9px]">L{f.line}</Badge>}
                  <span className="font-medium text-foreground">{f.title}</span>
                </div>
                <p className="text-muted-foreground">{f.description}</p>
                {f.recommendation && <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {f.recommendation}</p>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ No findings — code looks clean.</p>
        </CardContent></Card>
      )}
    </>
  );
}

// ─── Repair Panel (AI) ───────────────────────────────────────────────────

function RepairPanel() {
  const { repairCode, setRepairCode, repair, repairing, runRepair } = useFlutterPlatformStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">AI Repair Center</h3>
        <Button size="sm" onClick={runRepair} disabled={repairing || !repairCode.trim()}>
          {repairing ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Hammer className="mr-1 h-3.5 w-3.5" />}
          Detect Issues
        </Button>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Paste Dart code to scan for bugs</h4>
        <textarea
          value={repairCode}
          onChange={(e) => setRepairCode(e.target.value)}
          className="ff-scroll h-40 w-full resize-y rounded border border-border/60 bg-card p-2 font-mono text-[11px] text-foreground outline-none focus:border-primary"
          placeholder="Paste your Dart/Flutter code here…"
        />
      </CardContent></Card>
      {repair && <RepairResults repair={repair} />}
    </div>
  );
}

function RepairResults({ repair }: { repair: RepairResult }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Issues" value={repair.issues.length} />
        <Metric label="Auto-Fixable" value={<span className="text-emerald-600 dark:text-emerald-400">{repair.autoFixableCount}</span>} />
        <Metric label="Critical" value={<span className={repair.criticalCount > 0 ? "text-rose-600 dark:text-rose-400" : ""}>{repair.criticalCount}</span>} />
      </div>
      {repair.summary && <p className="text-xs text-muted-foreground">{repair.summary}</p>}
      {repair.issues.length > 0 ? (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Issues ({repair.issues.length})</h4>
          <div className="max-h-96 space-y-2 overflow-y-auto ff-scroll">
            {repair.issues.map((i) => (
              <div key={i.id} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", severityBadgeClass(i.severity))}>{i.severity}</Badge>
                  <Badge variant="outline" className="text-[9px]">{i.type}</Badge>
                  {i.autoFixable && <Badge variant="outline" className="text-[9px] text-emerald-600">auto-fixable</Badge>}
                  <span className="font-medium text-foreground">{i.title}</span>
                </div>
                <p className="text-muted-foreground">{i.description}</p>
                {i.fix && <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {i.fix}</p>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ No issues detected.</p>
        </CardContent></Card>
      )}
    </>
  );
}

// ─── Build Readiness Panel (real VFS checks) ─────────────────────────────

function BuildPanel() {
  const { buildReadiness, checkingBuild, checkBuild } = useFlutterPlatformStore();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Build Readiness</h3>
        <Button size="sm" onClick={checkBuild} disabled={checkingBuild}>
          {checkingBuild ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Package className="mr-1 h-3.5 w-3.5" />}
          Re-check
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">Static checks against the workspace virtual filesystem.</p>
      {buildReadiness ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric label="Ready" value={<span className={buildReadiness.ready ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>{buildReadiness.ready ? "Yes" : "No"}</span>} />
            <Metric label="Score" value={<span className={scoreColor(buildReadiness.score)}>{buildReadiness.score}/100</span>} />
            <Metric label="Blockers" value={buildReadiness.blockers.length} />
          </div>
          <Card><CardContent className="p-3">
            <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Checks ({buildReadiness.checks.length})</h4>
            <div className="space-y-1.5">
              {buildReadiness.checks.map((c) => (
                <div key={c.id} className="flex items-center gap-2 text-xs">
                  {c.status === "pass" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> :
                   c.status === "warning" ? <ShieldAlert className="h-3.5 w-3.5 text-amber-600" /> :
                   <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />}
                  <span className="font-medium text-foreground">{c.label}</span>
                  <Badge variant="outline" className={cn("text-[9px] capitalize", c.status === "pass" ? "text-emerald-600" : c.status === "warning" ? "text-amber-600" : "text-rose-600")}>{c.status}</Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground">{c.message}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
          {buildReadiness.blockers.length > 0 && (
            <Card><CardContent className="p-3">
              <h4 className="mb-2 text-[10px] font-semibold uppercase text-rose-600">Blockers</h4>
              <ul className="space-y-1">{buildReadiness.blockers.map((b, i) => <li key={i} className="text-xs text-rose-600 dark:text-rose-400">✗ {b}</li>)}</ul>
            </CardContent></Card>
          )}
        </>
      ) : (
        <EmptyState icon={Package} title="Check build readiness" description="Run a series of static checks to see if the workspace is ready for `flutter build`." />
      )}
    </div>
  );
}

// ─── Knowledge Panel (uses real knowledge base) ──────────────────────────

function KnowledgePanel() {
  const [entries] = React.useState(flutterKnowledge);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Knowledge Base ({entries.length})</h3>
      {entries.map(e => (
        <Card key={e.id}><CardContent className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] capitalize">{e.category}</Badge>
            <span className="text-sm font-medium text-foreground">{e.topic}</span>
          </div>
          <p className="text-xs text-muted-foreground">{e.summary}</p>
          <Separator className="my-2" />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div>
              <h5 className="text-[9px] font-semibold uppercase text-muted-foreground">Details</h5>
              <ul className="space-y-0.5">{e.details.map((d, i) => <li key={i} className="text-[10px] text-foreground">• {d}</li>)}</ul>
            </div>
            <div>
              <h5 className="text-[9px] font-semibold uppercase text-emerald-600">Best Practices</h5>
              <ul className="space-y-0.5">{e.bestPractices.map((b, i) => <li key={i} className="text-[10px] text-foreground">✓ {b}</li>)}</ul>
            </div>
            <div>
              <h5 className="text-[9px] font-semibold uppercase text-rose-600">Pitfalls</h5>
              <ul className="space-y-0.5">{e.pitfalls.map((p, i) => <li key={i} className="text-[10px] text-foreground">✗ {p}</li>)}</ul>
            </div>
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}
