"use client";

import * as React from "react";
import {
  Eye, Layers, Palette, Accessibility, Gauge, GitCompare,
  Lightbulb, History, BarChart3, FileText, Play, Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Vision Dashboard", icon: Eye },
  { id: "screen", label: "Screen Analysis", icon: Eye },
  { id: "layout", label: "Layout Analysis", icon: Layers },
  { id: "design", label: "Design Review", icon: Palette },
  { id: "a11y", label: "Accessibility", icon: Accessibility },
  { id: "performance", label: "Performance", icon: Gauge },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "comparison", label: "Comparison", icon: GitCompare },
  { id: "history", label: "History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function VisionAIPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const [report, setReport] = React.useState<any>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/v1/vision/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setReport(data.data);
      toast.success(`Analysis complete — Score: ${data.data.overallScore}/100`);
    } catch { toast.error("Analysis failed"); }
    setAnalyzing(false);
  };

  React.useEffect(() => { if (!report) runAnalysis(); }, []);

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
        <Button size="sm" className="ml-auto h-7 text-xs" onClick={runAnalysis} disabled={analyzing}>
          {analyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          {analyzing ? "Analyzing..." : "Analyze"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard report={report} onNavigate={setActive} />}
        {active === "screen" && <ScreenAnalysis report={report} />}
        {active === "layout" && <LayoutAnalysis report={report} />}
        {active === "design" && <DesignReview report={report} />}
        {active === "a11y" && <AccessibilityReview report={report} />}
        {active === "performance" && <PerformanceReview report={report} />}
        {active === "recommendations" && <Recommendations report={report} />}
        {active === "comparison" && <ComparisonViewer />}
        {active === "history" && <HistoryPanel />}
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

const severityColors: Record<string, string> = {
  critical: "text-rose-600", high: "text-orange-600", medium: "text-amber-600", low: "text-sky-600", suggestion: "text-muted-foreground",
};

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ report, onNavigate }: { report: any; onNavigate: (t: TabId) => void }) {
  if (!report) return <EmptyState icon={Eye} title="No analysis yet" description="Click Analyze to run a vision analysis." />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">👁️</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Vision AI Analysis</h2>
          <p className="text-xs text-muted-foreground">{report.executiveSummary}</p>
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-bold", report.overallScore > 70 ? "text-emerald-600" : report.overallScore > 50 ? "text-amber-600" : "text-rose-600")}>{report.overallScore}</div>
          <div className="text-[10px] text-muted-foreground">Overall Score</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Issues" value={report.issues.length} className={report.issues.length > 5 ? "border-amber-500/30" : ""} />
        <Metric label="Confidence" value={`${(report.confidence.score * 100).toFixed(0)}%`} />
        <Metric label="Screen Type" value={report.screenUnderstanding.screenType} />
        <Metric label="Recommendations" value={report.recommendations.length} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {[
          { label: "Layout", score: report.layout.score, tab: "layout" },
          { label: "Widget", score: report.widget.score, tab: "layout" },
          { label: "Design", score: report.design.overallScore, tab: "design" },
          { label: "Accessibility", score: report.accessibility.score, tab: "a11y" },
          { label: "Performance", score: report.performance.score, tab: "performance" },
          { label: "Responsive", score: report.responsive.overallScore, tab: "performance" },
        ].map((s) => (
          <button key={s.label} onClick={() => onNavigate(s.tab as TabId)} className="rounded-lg border border-border/60 bg-card p-3 text-left transition-all hover:border-primary/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              <span className={cn("text-lg font-bold", s.score > 70 ? "text-emerald-600" : s.score > 50 ? "text-amber-600" : "text-rose-600")}>{s.score}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className={cn("h-full rounded-full", s.score > 70 ? "bg-emerald-500" : s.score > 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${s.score}%` }} />
            </div>
          </button>
        ))}
      </div>

      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Confidence Evidence</h4>
        <ul className="space-y-0.5">{report.confidence.evidence.map((e: string, i: number) => <li key={i} className="text-xs text-foreground">✓ {e}</li>)}</ul>
        <p className="mt-2 text-[10px] text-muted-foreground">{report.confidence.reasoning}</p>
      </CardContent></Card>
    </div>
  );
}

// ─── Screen Analysis ────────────────────────────────────────────────────

function ScreenAnalysis({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Eye} title="No analysis" />;
  const s = report.screenUnderstanding;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Screen Type" value={s.screenType} />
        <Metric label="Current Page" value={s.currentPage} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Detected Elements</h4>
        <div className="grid grid-cols-2 gap-1">
          {s.elements.filter((e: any) => e.present).map((e: any) => (
            <div key={e.type} className="flex items-center gap-2 text-xs"><Badge variant="outline" className="text-[9px] capitalize">{e.type}</Badge><span className="text-foreground">×{e.count}</span></div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Layout Analysis ────────────────────────────────────────────────────

function LayoutAnalysis({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Layers} title="No analysis" />;
  const layoutFindings = report.issues.filter((i: any) => i.category === "layout");
  const widgetFindings = report.issues.filter((i: any) => i.category === "widget");
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Layout Score" value={`${report.layout.score}/100`} />
        <Metric label="Widget Score" value={`${report.widget.score}/100`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Layout Issues ({layoutFindings.length})</h4>
        {layoutFindings.map((f: any) => <IssueRow key={f.id} issue={f} />)}
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Widget Issues ({widgetFindings.length})</h4>
        {widgetFindings.map((f: any) => <IssueRow key={f.id} issue={f} />)}
      </CardContent></Card>
    </div>
  );
}

function IssueRow({ issue }: { issue: any }) {
  return (
    <div className="mb-1.5 flex items-start gap-2 rounded border border-border/60 p-2 text-xs">
      <Badge variant="outline" className={cn("text-[9px] shrink-0 capitalize", severityColors[issue.severity])}>{issue.severity}</Badge>
      <div className="flex-1">
        <span className="font-medium text-foreground">{issue.title}</span>
        <p className="text-muted-foreground">{issue.description}</p>
        <p className="text-emerald-600 dark:text-emerald-400">→ {issue.suggestion}</p>
      </div>
    </div>
  );
}

// ─── Design Review ──────────────────────────────────────────────────────

function DesignReview({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Palette} title="No analysis" />;
  const d = report.design;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Overall" value={`${d.overallScore}/100`} />
        <Metric label="Material 3" value={`${d.material3Score}/100`} />
        <Metric label="Typography" value={`${d.typographyScore}/100`} />
        <Metric label="Color" value={`${d.colorScore}/100`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Design Findings ({d.findings.length})</h4>
        {d.findings.map((f: any) => (
          <div key={f.id} className="mb-1.5 flex items-start gap-2 rounded border border-border/60 p-2 text-xs">
            <Badge variant="outline" className={cn("text-[9px] shrink-0", severityColors[f.severity])}>{f.severity}</Badge>
            <div className="flex-1">
              <span className="font-medium text-foreground">{f.message}</span>
              <p className="text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0">{f.category}</Badge>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── Accessibility ──────────────────────────────────────────────────────

function AccessibilityReview({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Accessibility} title="No analysis" />;
  const a = report.accessibility;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Metric label="A11y Score" value={`${a.score}/100`} className={a.score < 70 ? "border-rose-500/30" : ""} />
        <Metric label="WCAG Level" value={a.wcagLevel} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Accessibility Issues ({a.findings.length})</h4>
        {a.findings.map((f: any) => (
          <div key={f.id} className="mb-1.5 flex items-start gap-2 rounded border border-border/60 p-2 text-xs">
            <Badge variant="outline" className={cn("text-[9px] shrink-0 capitalize", severityColors[f.severity])}>{f.severity}</Badge>
            <div className="flex-1">
              <span className="font-medium text-foreground">{f.message}</span>
              <p className="text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── Performance ────────────────────────────────────────────────────────

function PerformanceReview({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Gauge} title="No analysis" />;
  const p = report.performance;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Perf Score" value={`${p.score}/100`} />
        <Metric label="FPS" value={p.fps} className={p.fps < 50 ? "border-amber-500/30" : "border-emerald-500/30"} />
        <Metric label="Jank" value={p.jankCount} className={p.jankCount > 5 ? "border-rose-500/30" : ""} />
        <Metric label="Memory" value={`${p.memoryMb}MB`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Performance Issues ({p.findings.length})</h4>
        {p.findings.map((f: any) => (
          <div key={f.id} className="mb-1.5 flex items-start gap-2 rounded border border-border/60 p-2 text-xs">
            <Badge variant="outline" className={cn("text-[9px] shrink-0 capitalize", severityColors[f.severity])}>{f.severity}</Badge>
            <div className="flex-1"><span className="font-medium text-foreground">{f.message}</span><p className="text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p></div>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── Recommendations ────────────────────────────────────────────────────

function Recommendations({ report }: { report: any }) {
  if (!report) return <EmptyState icon={Lightbulb} title="No recommendations" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Recommendations ({report.recommendations.length})</h3>
      {report.recommendations.map((r: any) => (
        <Card key={r.id}><CardContent className="p-3">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className={cn("text-[9px] shrink-0 capitalize", r.priority === "high" ? "text-rose-600" : r.priority === "medium" ? "text-amber-600" : "text-muted-foreground")}>{r.priority}</Badge>
            <div className="flex-1">
              <span className="text-sm font-medium text-foreground">{r.title}</span>
              <p className="text-xs text-muted-foreground">{r.description}</p>
              <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">→ {r.action}</p>
            </div>
            <Badge variant="outline" className="text-[9px] shrink-0">{r.category}</Badge>
          </div>
        </CardContent></Card>
      ))}
    </div>
  );
}

// ─── Comparison ─────────────────────────────────────────────────────────

function ComparisonViewer() {
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const compare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/vision/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ screenshotA: { id: "a", width: 1080, height: 2400, orientation: "portrait", deviceId: "emulator-5554" }, screenshotB: { id: "b", width: 1080, height: 2400, orientation: "landscape", deviceId: "emulator-5554" } }) });
      const data = await res.json();
      setResult(data.data);
      toast.success("Comparison complete");
    } catch { toast.error("Comparison failed"); }
    setLoading(false);
  };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Screenshot Comparison</h3>
        <Button size="sm" onClick={compare} disabled={loading}>{loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <GitCompare className="mr-1 h-3.5 w-3.5" />}Compare</Button>
      </div>
      {result ? (
        <>
          <Metric label="Visual Similarity" value={`${result.visualSimilarity}%`} className={result.visualSimilarity > 80 ? "border-emerald-500/30" : "border-amber-500/30"} />
          <p className="text-sm text-muted-foreground">{result.summary}</p>
          {result.layoutDifferences.length > 0 && <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Layout Differences</h4>{result.layoutDifferences.map((d: string, i: number) => <div key={i} className="text-xs text-foreground">⚠ {d}</div>)}</CardContent></Card>}
          {result.widgetDifferences.length > 0 && <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Widget Differences</h4>{result.widgetDifferences.map((d: string, i: number) => <div key={i} className="text-xs text-foreground">⚠ {d}</div>)}</CardContent></Card>}
          {result.themeDifferences.length > 0 && <Card><CardContent className="p-3"><h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Theme Differences</h4>{result.themeDifferences.map((d: string, i: number) => <div key={i} className="text-xs text-foreground">⚠ {d}</div>)}</CardContent></Card>}
        </>
      ) : <EmptyState icon={GitCompare} title="Compare two screenshots" description="Compare screenshots for layout, widget, theme, and visual similarity differences." />}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const [history, setHistory] = React.useState<any[]>([]);
  React.useEffect(() => { fetch("/api/v1/vision/history").then(r => r.json()).then(d => setHistory(d.data ?? [])).catch(() => {}); }, []);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Analysis History</h3>
      {history.length === 0 ? <EmptyState icon={History} title="No history yet" /> : history.map((h: any) => (
        <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
          <Badge variant="outline" className="text-[9px]">{h.overallScore}/100</Badge>
          <span className="text-muted-foreground">Confidence: {(h.confidence * 100).toFixed(0)}%</span>
          <span className="text-muted-foreground">{h.issueCount} issues</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const [metrics, setMetrics] = React.useState<any>(null);
  React.useEffect(() => { fetch("/api/v1/vision/metrics").then(r => r.json()).then(d => setMetrics(d.data)).catch(() => {}); }, []);
  if (!metrics) return <EmptyState icon={BarChart3} title="No metrics" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Vision AI Metrics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Analyses" value={metrics.totalAnalyses} />
        <Metric label="Issues Found" value={metrics.totalIssues} />
        <Metric label="Avg Score" value={`${metrics.averageScore}/100`} />
        <Metric label="Avg Confidence" value={`${(metrics.averageConfidence * 100).toFixed(0)}%`} />
      </div>
      {metrics.commonIssueCategories.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Issue Categories</h4>
          {metrics.commonIssueCategories.map((c: any) => <div key={c.category} className="flex items-center gap-2 text-xs"><span className="capitalize text-foreground">{c.category}</span><span className="ml-auto font-mono">{c.count}</span></div>)}
        </CardContent></Card>
      )}
    </div>
  );
}

void FileText;
