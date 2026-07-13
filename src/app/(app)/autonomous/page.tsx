"use client";

import * as React from "react";
import {
  Bot, Activity, GitBranch, Eye, CheckCircle2, AlertTriangle,
  Lightbulb, History, BarChart3, Play, Loader2, Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Autonomous Dashboard", icon: Bot },
  { id: "pipeline", label: "Engineering Pipeline", icon: GitBranch },
  { id: "root-cause", label: "Root Cause", icon: Activity },
  { id: "patch", label: "Patch Planner", icon: Eye },
  { id: "simulation", label: "Simulation", icon: Shield },
  { id: "verification", label: "Verification", icon: CheckCircle2 },
  { id: "review", label: "Quality Review", icon: AlertTriangle },
  { id: "history", label: "Repair History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function AutonomousPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const [result, setResult] = React.useState<any>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/v1/autonomous/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setResult(data.data);
      toast.success(data.data.success ? `Repair successful — Score: ${data.data.verification?.afterScore}` : "Pipeline completed — review results");
    } catch { toast.error("Analysis failed"); }
    setAnalyzing(false);
  };

  React.useEffect(() => { if (!result) runAnalysis(); }, []);

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
          {analyzing ? "Running..." : "Run Pipeline"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard result={result} onNavigate={setActive} />}
        {active === "pipeline" && <PipelineView result={result} />}
        {active === "root-cause" && <RootCauseView result={result} />}
        {active === "patch" && <PatchView result={result} />}
        {active === "simulation" && <SimulationView result={result} />}
        {active === "verification" && <VerificationView result={result} />}
        {active === "review" && <ReviewPanel />}
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

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ result, onNavigate }: { result: any; onNavigate: (t: TabId) => void }) {
  if (!result) return <EmptyState icon={Bot} title="No analysis yet" description="Click Run Pipeline to start autonomous engineering." />;
  const { pipeline, confidence, decision, verification, regression } = result;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">🤖</div>
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-foreground">Autonomous Engineering</h2>
          <p className="text-xs text-muted-foreground">Pipeline status: <span className={pipeline.status === "completed" ? "text-emerald-600" : "text-amber-600"}>{pipeline.status}</span> · Decision: <span className="capitalize">{decision.action}</span></p>
        </div>
        <div className="text-right">
          <div className={cn("text-3xl font-bold", confidence.repairConfidence > 0.7 ? "text-emerald-600" : "text-amber-600")}>{(confidence.repairConfidence * 100).toFixed(0)}%</div>
          <div className="text-[10px] text-muted-foreground">Confidence</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Pipeline Status" value={pipeline.status} className={pipeline.status === "completed" ? "border-emerald-500/30" : "border-amber-500/30"} />
        <Metric label="Decision" value={decision.action.replace("-", " ")} />
        <Metric label="Risk Level" value={confidence.riskLevel} className={confidence.riskLevel === "safe" ? "border-emerald-500/30" : "border-amber-500/30"} />
        <Metric label="Success" value={result.success ? "Yes" : "No"} className={result.success ? "border-emerald-500/30" : "border-rose-500/30"} />
      </div>
      {verification && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Before Score" value={verification.beforeScore} />
          <Metric label="After Score" value={verification.afterScore} className={verification.afterScore > verification.beforeScore ? "border-emerald-500/30" : ""} />
          <Metric label="Issue Resolved" value={verification.issueResolved ? "Yes" : "No"} />
          <Metric label="Regressions" value={regression?.count ?? 0} className={regression && regression.count > 0 ? "border-rose-500/30" : "border-emerald-500/30"} />
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

// ─── Pipeline ───────────────────────────────────────────────────────────

function PipelineView({ result }: { result: any }) {
  if (!result) return <EmptyState icon={GitBranch} title="No pipeline" />;
  const steps = result.pipeline.steps;
  const stageIcons: Record<string, LucideIcon> = {
    problem: AlertTriangle, analysis: Activity, "root-cause": Activity,
    "repair-plan": Eye, simulation: Shield, validation: CheckCircle2,
    approval: Shield, execution: Play, verification: CheckCircle2, learning: Lightbulb,
  };
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Engineering Pipeline</h3>
      <div className="space-y-2">
        {steps.map((step: any, i: number) => {
          const Icon = stageIcons[step.stage] ?? Activity;
          return (
            <div key={i} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold shrink-0",
                step.status === "completed" ? "bg-emerald-500/15 text-emerald-600" :
                step.status === "active" ? "bg-sky-500/15 text-sky-600" :
                step.status === "failed" ? "bg-rose-500/15 text-rose-600" :
                step.status === "skipped" ? "bg-muted text-muted-foreground" : "bg-muted text-muted-foreground")}>
                {step.status === "completed" ? "✓" : step.status === "failed" ? "✗" : step.status === "skipped" ? "–" : i + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-sm font-medium capitalize text-foreground">{step.stage.replace("-", " ")}</span>
                  <Badge variant="outline" className={cn("text-[9px] capitalize",
                    step.status === "completed" ? "text-emerald-600" :
                    step.status === "failed" ? "text-rose-600" :
                    step.status === "skipped" ? "text-muted-foreground" : "text-sky-600")}>{step.status}</Badge>
                </div>
                {step.completedAt && <p className="text-[10px] text-muted-foreground">{new Date(step.completedAt).toLocaleTimeString()}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Root Cause ─────────────────────────────────────────────────────────

function RootCauseView({ result }: { result: any }) {
  if (!result) return <EmptyState icon={Activity} title="No analysis" />;
  const rc = result.rootCause;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Root Cause Analysis</h3>
      <Card><CardContent className="p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Root Cause</span>
          <Badge variant="outline" className="text-[9px]">{(rc.confidence * 100).toFixed(0)}% confidence</Badge>
        </div>
        <p className="text-sm text-foreground">{rc.rootCause}</p>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Contributing Factors</h4>
        <ul className="space-y-0.5">{rc.contributingFactors.map((f: string, i: number) => <li key={i} className="text-xs text-foreground">• {f}</li>)}</ul>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Evidence</h4>
        <ul className="space-y-0.5">{rc.evidence.map((e: string, i: number) => <li key={i} className="text-xs text-foreground">✓ {e}</li>)}</ul>
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Alternatives</h4>
        <ul className="space-y-0.5">{rc.alternatives.map((a: string, i: number) => <li key={i} className="text-xs text-muted-foreground">↳ {a}</li>)}</ul>
      </CardContent></Card>
    </div>
  );
}

// ─── Patch Planner ──────────────────────────────────────────────────────

function PatchView({ result }: { result: any }) {
  if (!result) return <EmptyState icon={Eye} title="No patch plan" />;
  const { repairPlan, selectedCandidate } = result;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Patch Candidates ({repairPlan.candidates.length})</h3>
      <p className="text-xs text-muted-foreground">{repairPlan.rationale}</p>
      {repairPlan.candidates.map((c: any) => (
        <div key={c.id} className={cn("rounded-lg border p-3", c.id === selectedCandidate.id ? "border-primary/40 bg-primary/5" : "border-border/60 bg-card")}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-foreground">{c.title}</span>
            {c.id === selectedCandidate.id && <Badge variant="outline" className="text-[9px] text-emerald-600">selected</Badge>}
            <Badge variant="outline" className={cn("text-[9px] uppercase", c.riskLevel === "safe" ? "text-emerald-600" : c.riskLevel === "moderate" ? "text-amber-600" : "text-rose-600")}>{c.riskLevel}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-1">{c.description}</p>
          <div className="grid grid-cols-2 gap-1 text-[10px] text-muted-foreground">
            <div>Complexity: <span className="text-foreground">{c.estimatedComplexity}</span></div>
            <div>Failure: <span className="text-foreground">{(c.failureProbability * 100).toFixed(0)}%</span></div>
            <div>Files: <span className="font-mono text-foreground">{c.affectedFiles.join(", ")}</span></div>
            <div>Side effects: <span className="text-foreground">{c.sideEffects.length}</span></div>
          </div>
          <p className="mt-1 text-[10px] text-emerald-600">→ {c.expectedOutcome}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Simulation ─────────────────────────────────────────────────────────

function SimulationView({ result }: { result: any }) {
  if (!result) return <EmptyState icon={Shield} title="No simulation" />;
  const { simulation, validation, confidence } = result;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Simulation & Validation</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Success Probability" value={`${(simulation.successProbability * 100).toFixed(0)}%`} className="border-emerald-500/30" />
        <Metric label="Failure Probability" value={`${(simulation.failureProbability * 100).toFixed(0)}%`} />
        <Metric label="Validation Score" value={`${validation.score}/100`} className={validation.valid ? "border-emerald-500/30" : "border-amber-500/30"} />
        <Metric label="Confidence" value={`${(confidence.repairConfidence * 100).toFixed(0)}%`} />
      </div>
      {simulation.warnings.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-amber-600">Warnings</h4>
          {simulation.warnings.map((w: string, i: number) => <div key={i} className="text-xs text-amber-600">⚠ {w}</div>)}
        </CardContent></Card>
      )}
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Validation Checks</h4>
        {validation.checks.map((c: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className={cn("h-2 w-2 rounded-full shrink-0", c.passed ? "bg-emerald-500" : "bg-rose-500")} />
            <span className="font-medium text-foreground">{c.name}</span>
            <span className="text-muted-foreground">{c.message}</span>
          </div>
        ))}
      </CardContent></Card>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Confidence Factors</h4>
        {confidence.factors.map((f: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-xs py-0.5">
            <span className="w-24 text-muted-foreground">{f.name}</span>
            <div className="h-2 flex-1 overflow-hidden rounded bg-muted"><div className="h-full rounded bg-primary" style={{ width: `${f.value * 100}%` }} /></div>
            <span className="w-10 text-right font-mono">{(f.value * 100).toFixed(0)}%</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── Verification ───────────────────────────────────────────────────────

function VerificationView({ result }: { result: any }) {
  if (!result || !result.verification) return <EmptyState icon={CheckCircle2} title="No verification" />;
  const { verification, regression } = result;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Verification & Regression</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Before Score" value={verification.beforeScore} />
        <Metric label="After Score" value={verification.afterScore} className={verification.afterScore > verification.beforeScore ? "border-emerald-500/30" : ""} />
        <Metric label="Issue Resolved" value={verification.issueResolved ? "Yes" : "No"} className={verification.issueResolved ? "border-emerald-500/30" : "border-rose-500/30"} />
        <Metric label="Regressions" value={regression?.count ?? 0} className={regression && regression.count > 0 ? "border-rose-500/30" : "border-emerald-500/30"} />
      </div>
      <Card><CardContent className="p-3"><p className="text-sm text-foreground">{verification.summary}</p></CardContent></Card>
      {regression && regression.issues.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-1 text-[10px] font-semibold uppercase text-rose-600">Regression Issues</h4>
          {regression.issues.map((r: any, i: number) => <div key={i} className="text-xs text-rose-600">⚠ {r.description}</div>)}
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Review ─────────────────────────────────────────────────────────────

function ReviewPanel() {
  const [data, setData] = React.useState<any>(null);
  React.useEffect(() => { fetch("/api/v1/autonomous/review").then(r => r.json()).then(d => setData(d.data)).catch(() => {}); }, []);
  if (!data) return <EmptyState icon={AlertTriangle} title="No review" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Quality Review</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Overall" value={`${data.quality.overall}/100`} />
        <Metric label="Maintainability" value={`${data.quality.maintainability}/100`} />
        <Metric label="Complexity" value={`${data.quality.complexity}/100`} />
        <Metric label="Performance" value={`${data.quality.performance}/100`} />
        <Metric label="Accessibility" value={`${data.quality.accessibility}/100`} />
        <Metric label="Architecture" value={`${data.quality.architecture}/100`} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Review Findings ({data.findings.length})</h4>
        {data.findings.map((f: any) => (
          <div key={f.id} className="mb-1.5 flex items-start gap-2 rounded border border-border/60 p-2 text-xs">
            <Badge variant="outline" className={cn("text-[9px] shrink-0", f.severity === "error" ? "text-rose-600" : f.severity === "warning" ? "text-amber-600" : "text-muted-foreground")}>{f.severity}</Badge>
            <div className="flex-1"><span className="font-medium text-foreground">{f.message}</span><p className="text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p></div>
            <Badge variant="outline" className="text-[9px] shrink-0">{f.category}</Badge>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const [history, setHistory] = React.useState<any[]>([]);
  React.useEffect(() => { fetch("/api/v1/autonomous/history").then(r => r.json()).then(d => setHistory(d.data ?? [])).catch(() => {}); }, []);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Repair History</h3>
      {history.length === 0 ? <EmptyState icon={History} title="No history yet" /> : history.map((h: any) => (
        <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
          <Badge variant="outline" className={cn("text-[9px]", h.success ? "text-emerald-600" : "text-rose-600")}>{h.success ? "✓" : "✗"}</Badge>
          <span className="font-medium text-foreground">{h.problemTitle}</span>
          <span className="text-muted-foreground">{(h.confidence * 100).toFixed(0)}% conf</span>
          {h.rolledBack && <Badge variant="outline" className="text-[9px] text-amber-600">rolled back</Badge>}
          <span className="ml-auto text-[10px] text-muted-foreground">{new Date(h.timestamp).toLocaleTimeString()}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const [metrics, setMetrics] = React.useState<any>(null);
  React.useEffect(() => { fetch("/api/v1/autonomous/metrics").then(r => r.json()).then(d => setMetrics(d.data)).catch(() => {}); }, []);
  if (!metrics) return <EmptyState icon={BarChart3} title="No metrics" />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Autonomous Metrics</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Problems" value={metrics.totalProblems} />
        <Metric label="Total Repairs" value={metrics.totalRepairs} />
        <Metric label="Success Rate" value={`${(metrics.successRate * 100).toFixed(0)}%`} />
        <Metric label="Avg Confidence" value={`${(metrics.averageConfidence * 100).toFixed(0)}%`} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Rollbacks" value={metrics.rollbackCount} className={metrics.rollbackCount > 0 ? "border-amber-500/30" : ""} />
        <Metric label="Avg Duration" value={`${metrics.averageDurationMs}ms`} />
      </div>
    </div>
  );
}
