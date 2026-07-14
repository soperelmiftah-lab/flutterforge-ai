"use client";

import * as React from "react";
import {
  Eye, Layers, Palette, Accessibility, Gauge, GitCompare,
  Lightbulb, History, BarChart3, Play, Loader2, RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useVisionAIStore } from "@/stores";
import type { IssueSeverity } from "@/features/vision-ai/types";
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
  const { report, analyzing, runAnalysis, hydrate } = useVisionAIStore();

  React.useEffect(() => { void hydrate(); }, [hydrate]);

  const handleAnalyze = async () => {
    toast.info("Running Vision AI analysis…");
    const r = await runAnalysis();
    if (r) {
      toast.success(`Analysis complete — Score: ${r.overallScore}/100, ${r.issues.length} issues`);
    } else {
      toast.error("Analysis failed");
    }
  };

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
        <Button size="sm" className="ml-auto h-7 text-xs" onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          {analyzing ? "Analyzing…" : "Analyze"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "screen" && <ScreenAnalysis />}
        {active === "layout" && <LayoutAnalysisPanel />}
        {active === "design" && <DesignReview />}
        {active === "a11y" && <AccessibilityReview />}
        {active === "performance" && <PerformanceReview />}
        {active === "recommendations" && <RecommendationsPanel />}
        {active === "comparison" && <ComparisonViewer />}
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

function severityColor(s: IssueSeverity): string {
  switch (s) {
    case "critical": return "text-rose-700 dark:text-rose-300";
    case "high": return "text-rose-600 dark:text-rose-400";
    case "medium": return "text-amber-600 dark:text-amber-400";
    case "low": return "text-sky-600 dark:text-sky-400";
    case "suggestion": return "text-muted-foreground";
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  if (score >= 40) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all", score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : score >= 40 ? "bg-orange-500" : "bg-rose-500")} style={{ width: `${score}%` }} />
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { report, metrics, analyzing } = useVisionAIStore();

  if (analyzing && !report) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">👁️</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Vision AI & Autonomous UI Analysis</h2>
          <p className="text-xs text-muted-foreground">Real heuristic analysis + AI-enhanced executive summary. Pulls live data from the Visual Runtime (screenshots, widget trees, performance, layout).</p>
        </div>
      </div>

      {report ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Overall Score" value={<span className={scoreColor(report.overallScore)}>{report.overallScore}/100</span>} />
            <Metric label="Issues" value={report.issues.length} />
            <Metric label="Confidence" value={`${(report.confidence.score * 100).toFixed(0)}%`} />
            <Metric label="Screen" value={<span className="capitalize text-sm">{report.screenUnderstanding.screenType}</span>} />
          </div>

          <Card>
            <CardContent className="p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Executive Summary</h4>
              <p className="text-sm text-foreground leading-relaxed">{report.executiveSummary}</p>
              <Separator className="my-3" />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] text-muted-foreground">Layout</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.layout.score))}>{report.layout.score}/100</div>
                  <ScoreBar score={report.layout.score} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Widget</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.widget.score))}>{report.widget.score}/100</div>
                  <ScoreBar score={report.widget.score} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Design</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.design.overallScore))}>{report.design.overallScore}/100</div>
                  <ScoreBar score={report.design.overallScore} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Accessibility</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.accessibility.score))}>{report.accessibility.score}/100</div>
                  <ScoreBar score={report.accessibility.score} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Performance</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.performance.score))}>{report.performance.score}/100</div>
                  <ScoreBar score={report.performance.score} />
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground">Responsive</div>
                  <div className={cn("text-sm font-semibold", scoreColor(report.responsive.overallScore))}>{report.responsive.overallScore}/100</div>
                  <ScoreBar score={report.responsive.overallScore} />
                </div>
              </div>
            </CardContent>
          </Card>

          {metrics && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Total Analyses" value={metrics.totalAnalyses} />
              <Metric label="Total Issues" value={metrics.totalIssues} />
              <Metric label="Avg Score" value={metrics.averageScore || "—"} />
              <Metric label="Avg Confidence" value={metrics.averageConfidence ? `${(metrics.averageConfidence * 100).toFixed(0)}%` : "—"} />
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Eye} title="No analysis yet" description="Click Analyze to run the Vision AI pipeline." />
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

// ─── Screen Analysis ────────────────────────────────────────────────────

function ScreenAnalysis() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Eye} title="No analysis" description="Run an analysis first." />;
  const s = report.screenUnderstanding;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Screen Understanding</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Screen Type" value={<span className="capitalize">{s.screenType}</span>} />
        <Metric label="Current Page" value={s.currentPage} />
        <Metric label="Confidence" value={`${(s.confidence * 100).toFixed(0)}%`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Detected Elements</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {s.elements.map((e) => (
            <div key={e.type} className="flex items-center gap-2 text-xs">
              <span className={cn("h-2 w-2 rounded-full", e.present ? "bg-emerald-500" : "bg-muted")} />
              <span className="capitalize text-foreground">{e.type}</span>
              {e.present && <span className="text-[10px] text-muted-foreground">×{e.count}</span>}
            </div>
          ))}
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Layout Analysis ────────────────────────────────────────────────────

function LayoutAnalysisPanel() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Layers} title="No analysis" description="Run an analysis first." />;
  const l = report.layout;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Layout Analysis</h3>
        <Badge variant="outline" className={cn("text-[9px]", scoreColor(l.score))}>{l.score}/100</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Total Widgets" value={l.totalWidgets} />
        <Metric label="Issues" value={l.issueCount} />
        <Metric label="Score" value={<span className={scoreColor(l.score)}>{l.score}/100</span>} />
      </div>
      {l.findings.length === 0 ? (
        <Card><CardContent className="p-3"><p className="text-xs text-emerald-600">✓ No layout issues.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {l.findings.map((f) => (
            <Card key={f.id}><CardContent className="p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", severityColor(f.severity))}>{f.severity}</Badge>
                <Badge variant="outline" className="text-[9px]">{f.type}</Badge>
                <span className="font-mono text-foreground">{f.widget}</span>
              </div>
              <p className="text-muted-foreground">{f.message}</p>
              <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Design Review ──────────────────────────────────────────────────────

function DesignReview() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Palette} title="No analysis" description="Run an analysis first." />;
  const d = report.design;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Design Review</h3>
        <Badge variant="outline" className={cn("text-[9px]", scoreColor(d.overallScore))}>{d.overallScore}/100</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Material 3" value={<span className={scoreColor(d.material3Score)}>{d.material3Score}</span>} />
        <Metric label="Typography" value={<span className={scoreColor(d.typographyScore)}>{d.typographyScore}</span>} />
        <Metric label="Color" value={<span className={scoreColor(d.colorScore)}>{d.colorScore}</span>} />
        <Metric label="Spacing" value={<span className={scoreColor(d.spacingScore)}>{d.spacingScore}</span>} />
      </div>
      {d.findings.length > 0 && (
        <div className="space-y-2">
          {d.findings.map((f) => (
            <Card key={f.id}><CardContent className="p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", severityColor(f.severity))}>{f.severity}</Badge>
                <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
              </div>
              <p className="text-muted-foreground">{f.message}</p>
              <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Accessibility ──────────────────────────────────────────────────────

function AccessibilityReview() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Accessibility} title="No analysis" description="Run an analysis first." />;
  const a = report.accessibility;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Accessibility Review</h3>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[9px]", scoreColor(a.score))}>{a.score}/100</Badge>
          <Badge variant="outline" className="text-[9px]">WCAG {a.wcagLevel}</Badge>
        </div>
      </div>
      {a.findings.length === 0 ? (
        <Card><CardContent className="p-3"><p className="text-xs text-emerald-600">✓ No accessibility issues.</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {a.findings.map((f) => (
            <Card key={f.id}><CardContent className="p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", severityColor(f.severity))}>{f.severity}</Badge>
                <Badge variant="outline" className="text-[9px]">{f.type}</Badge>
              </div>
              <p className="text-muted-foreground">{f.message}</p>
              <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Performance ────────────────────────────────────────────────────────

function PerformanceReview() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Gauge} title="No analysis" description="Run an analysis first." />;
  const p = report.performance;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Performance Review</h3>
        <Badge variant="outline" className={cn("text-[9px]", scoreColor(p.score))}>{p.score}/100</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="FPS" value={<span className={p.fps < 55 ? "text-amber-600" : "text-emerald-600"}>{p.fps}</span>} />
        <Metric label="Jank Count" value={p.jankCount} />
        <Metric label="Memory" value={`${p.memoryMb}MB`} />
        <Metric label="Frame Time" value={`${p.frameTimeMs}ms`} />
      </div>
      {p.findings.length > 0 && (
        <div className="space-y-2">
          {p.findings.map((f) => (
            <Card key={f.id}><CardContent className="p-3 text-xs">
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[9px] capitalize", severityColor(f.severity))}>{f.severity}</Badge>
                <Badge variant="outline" className="text-[9px]">{f.type}</Badge>
              </div>
              <p className="text-muted-foreground">{f.message}</p>
              <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Recommendations ────────────────────────────────────────────────────

function RecommendationsPanel() {
  const { report } = useVisionAIStore();
  if (!report) return <EmptyState icon={Lightbulb} title="No analysis" description="Run an analysis first." />;
  if (report.recommendations.length === 0) return <EmptyState icon={Lightbulb} title="No recommendations" description="The screen is already well-optimized." />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Recommendations ({report.recommendations.length})</h3>
      {report.recommendations.map((r) => (
        <Card key={r.id}><CardContent className="p-3 text-xs">
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className={cn("text-[9px] capitalize", r.priority === "high" ? "text-rose-600" : r.priority === "medium" ? "text-amber-600" : "text-sky-600")}>{r.priority}</Badge>
            <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
            <Badge variant="outline" className="text-[9px] capitalize">{r.impact} impact</Badge>
            <span className="font-medium text-foreground">{r.title}</span>
          </div>
          <p className="text-muted-foreground">{r.description}</p>
          <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {r.action}</p>
        </CardContent></Card>
      ))}
    </div>
  );
}

// ─── Comparison ─────────────────────────────────────────────────────────

function ComparisonViewer() {
  const { reports, comparison, comparing, compare } = useVisionAIStore();
  const [aId, setAId] = React.useState("");
  const [bId, setBId] = React.useState("");

  React.useEffect(() => {
    if (!aId && reports.length > 0) setAId(reports[0].id);
    if (!bId && reports.length > 1) setBId(reports[1].id);
  }, [reports, aId, bId]);

  const handleCompare = async () => {
    if (!aId || !bId) {
      toast.error("Select two reports to compare");
      return;
    }
    const r = await compare(aId, bId);
    if (r) toast.success(`Similarity: ${r.visualSimilarity}%`);
  };

  if (reports.length < 2) {
    return <EmptyState icon={GitCompare} title="Need at least 2 reports" description="Run analysis at least twice to compare reports." />;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Report Comparison</h3>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select value={aId} onChange={(e) => setAId(e.target.value)} className="flex-1 rounded border border-border bg-card p-2 text-xs">
          {reports.map((r) => <option key={r.id} value={r.id}>{r.id} — Score {r.overallScore}</option>)}
        </select>
        <span className="text-xs text-muted-foreground">vs</span>
        <select value={bId} onChange={(e) => setBId(e.target.value)} className="flex-1 rounded border border-border bg-card p-2 text-xs">
          {reports.map((r) => <option key={r.id} value={r.id}>{r.id} — Score {r.overallScore}</option>)}
        </select>
        <Button size="sm" onClick={handleCompare} disabled={comparing || aId === bId}>
          {comparing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <GitCompare className="mr-1 h-3 w-3" />}
          Compare
        </Button>
      </div>
      {comparison && (
        <Card><CardContent className="p-3">
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="outline" className="text-[9px]">{comparison.visualSimilarity}% similar</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{comparison.summary}</p>
          {comparison.layoutDifferences.length > 0 && (
            <div className="mt-2">
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground">Layout Differences</h4>
              <ul className="space-y-0.5">{comparison.layoutDifferences.map((d, i) => <li key={i} className="text-xs text-foreground">• {d}</li>)}</ul>
            </div>
          )}
          {comparison.widgetDifferences.length > 0 && (
            <div className="mt-2">
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground">Widget Differences</h4>
              <ul className="space-y-0.5">{comparison.widgetDifferences.map((d, i) => <li key={i} className="text-xs text-foreground">• {d}</li>)}</ul>
            </div>
          )}
          {comparison.themeDifferences.length > 0 && (
            <div className="mt-2">
              <h4 className="text-[10px] font-semibold uppercase text-muted-foreground">Theme Differences</h4>
              <ul className="space-y-0.5">{comparison.themeDifferences.map((d, i) => <li key={i} className="text-xs text-foreground">• {d}</li>)}</ul>
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const { history, refreshHistory } = useVisionAIStore();
  React.useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Analysis History ({history.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshHistory()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      {history.length === 0 ? (
        <EmptyState icon={History} title="No history" description="Run an analysis to see history." />
      ) : (
        <div className="space-y-1.5">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              <Badge variant="outline" className={cn("text-[9px]", scoreColor(h.overallScore))}>{h.overallScore}/100</Badge>
              <span className="text-muted-foreground">{h.issueCount} issues</span>
              <span className="text-muted-foreground">· {(h.confidence * 100).toFixed(0)}% conf</span>
              <span className="ml-auto text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { metrics, refreshMetrics } = useVisionAIStore();
  React.useEffect(() => { void refreshMetrics(); }, [refreshMetrics]);
  if (!metrics) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Vision AI Metrics</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshMetrics()}>
          <RefreshCw className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Analyses" value={metrics.totalAnalyses} />
        <Metric label="Total Issues" value={metrics.totalIssues} />
        <Metric label="Avg Score" value={metrics.averageScore || "—"} />
        <Metric label="Avg Confidence" value={metrics.averageConfidence ? `${(metrics.averageConfidence * 100).toFixed(0)}%` : "—"} />
      </div>
      {metrics.commonIssueCategories.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Issue Categories</h4>
          <div className="space-y-1">
            {metrics.commonIssueCategories.map((c) => (
              <div key={c.category} className="flex items-center gap-2 text-xs">
                <span className="capitalize text-foreground">{c.category}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-amber-500" style={{ width: `${(c.count / metrics.totalIssues) * 100}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {metrics.commonRecommendations.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Recommendations</h4>
          <div className="space-y-1">
            {metrics.commonRecommendations.map((c) => (
              <div key={c.category} className="flex items-center gap-2 text-xs">
                <span className="capitalize text-foreground">{c.category}</span>
                <span className="ml-auto text-[10px] text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
