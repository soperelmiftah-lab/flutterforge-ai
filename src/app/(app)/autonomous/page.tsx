"use client";

import * as React from "react";
import {
  Bot, Activity, GitBranch, Eye, CheckCircle2, AlertTriangle,
  Lightbulb, History, BarChart3, Play, Loader2, Shield, Sparkles,
  XCircle, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAutonomousStore } from "@/stores";
import type { ProblemCategory } from "@/features/autonomous/types";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Autonomous Dashboard", icon: Bot },
  { id: "pipeline", label: "Engineering Pipeline", icon: GitBranch },
  { id: "root-cause", label: "Root Cause", icon: Activity },
  { id: "patch", label: "Patch Planner", icon: Eye },
  { id: "simulation", label: "Simulation", icon: Shield },
  { id: "verification", label: "Verification", icon: CheckCircle2 },
  { id: "review", label: "Quality Review", icon: AlertTriangle },
  { id: "learning", label: "Learning", icon: Sparkles },
  { id: "history", label: "Repair History", icon: History },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

const CATEGORIES: ProblemCategory[] = [
  "layout-issue", "flutter-error", "dart-error", "analysis-error",
  "accessibility-issue", "performance-issue", "state-issue",
  "navigation-issue", "theme-issue", "dependency-issue",
  "build-failure", "runtime-exception",
];

export default function AutonomousPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const { result, running, runPipeline, hydrate } = useAutonomousStore();

  React.useEffect(() => { void hydrate(); }, [hydrate]);

  const handleRun = async () => {
    toast.info("Running autonomous pipeline…");
    const r = await runPipeline();
    if (r) {
      if (r.success) {
        toast.success(`Repair successful — Score: ${r.verification?.afterScore ?? "?"}, ${r.verification?.summary?.slice(0, 60) ?? ""}`);
      } else {
        toast.warning(`Pipeline completed — ${r.decision?.action}: ${r.decision?.reason?.slice(0, 60) ?? ""}`);
      }
    } else {
      toast.error("Pipeline failed");
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
        <Button size="sm" className="ml-auto h-7 text-xs" onClick={handleRun} disabled={running}>
          {running ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          {running ? "Running…" : "Run Pipeline"}
        </Button>
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard onNavigate={setActive} />}
        {active === "pipeline" && <PipelineView />}
        {active === "root-cause" && <RootCauseView />}
        {active === "patch" && <PatchView />}
        {active === "simulation" && <SimulationView />}
        {active === "verification" && <VerificationView />}
        {active === "review" && <ReviewPanel />}
        {active === "learning" && <LearningPanel />}
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

function scoreColor(score: number): string {
  if (score >= 0.8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 0.6) return "text-amber-600 dark:text-amber-400";
  if (score >= 0.4) return "text-orange-600 dark:text-orange-400";
  return "text-rose-600 dark:text-rose-400";
}

function riskColor(risk: string): string {
  switch (risk) {
    case "safe": return "text-emerald-600 dark:text-emerald-400";
    case "moderate": return "text-amber-600 dark:text-amber-400";
    case "high": return "text-orange-600 dark:text-orange-400";
    case "critical": return "text-rose-600 dark:text-rose-400";
    default: return "text-muted-foreground";
  }
}

function stageIcon(status: string): LucideIcon {
  switch (status) {
    case "completed": return CheckCircle2;
    case "failed": return XCircle;
    case "active": return Loader2;
    case "skipped": return AlertTriangle;
    default: return Activity;
  }
}

// ─── Dashboard ──────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (t: TabId) => void }) {
  const { result, metrics, running } = useAutonomousStore();

  if (running && !result) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">🤖</div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Autonomous Engineering System</h2>
          <p className="text-xs text-muted-foreground">Full engineering pipeline: Problem → Root Cause → Repair Plan → Simulation → Validation → Decision → Approval → Execution → Verification → Learning. AI-enhanced root cause + rationale. Pulls real data from Vision AI, Visual Runtime, and Flutter Runtime.</p>
        </div>
      </div>

      {result ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Status" value={result.success ? <span className="text-emerald-600">Success</span> : <span className="text-amber-600">Review</span>} />
            <Metric label="Decision" value={<span className="capitalize text-sm">{result.decision?.action}</span>} />
            <Metric label="Confidence" value={<span className={scoreColor(result.confidence?.repairConfidence ?? 0)}>{((result.confidence?.repairConfidence ?? 0) * 100).toFixed(0)}%</span>} />
            <Metric label="Risk" value={<span className={riskColor(result.selectedCandidate?.riskLevel ?? "")}>{result.selectedCandidate?.riskLevel}</span>} />
          </div>

          {result.aiRationale && (
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> AI Rationale
                </h4>
                <p className="text-xs text-foreground leading-relaxed">{result.aiRationale}</p>
              </CardContent>
            </Card>
          )}

          {result.pipeline && (
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pipeline Stages ({result.pipeline.steps.length})</h4>
                <div className="space-y-1.5">
                  {result.pipeline.steps.map((step) => {
                    const Icon = stageIcon(step.status);
                    return (
                      <div key={step.stage} className="flex items-center gap-2 text-xs">
                        <Icon className={cn("h-3.5 w-3.5", step.status === "completed" ? "text-emerald-600" : step.status === "failed" ? "text-rose-600" : step.status === "active" ? "text-sky-600 animate-spin" : "text-muted-foreground")} />
                        <span className="font-mono text-foreground">{step.stage}</span>
                        <Badge variant="outline" className={cn("text-[9px] capitalize", step.status === "completed" ? "text-emerald-600" : step.status === "failed" ? "text-rose-600" : "text-muted-foreground")}>{step.status}</Badge>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {metrics && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Total Problems" value={metrics.totalProblems} />
              <Metric label="Success Rate" value={`${(metrics.successRate * 100).toFixed(0)}%`} />
              <Metric label="Avg Confidence" value={`${(metrics.averageConfidence * 100).toFixed(0)}%`} />
              <Metric label="Rollbacks" value={metrics.rollbackCount} />
            </div>
          )}
        </>
      ) : (
        <EmptyState icon={Bot} title="No pipeline run yet" description="Click Run Pipeline to start the autonomous engineering loop." />
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

// ─── Pipeline View ──────────────────────────────────────────────────────

function PipelineView() {
  const { result } = useAutonomousStore();
  if (!result?.pipeline) return <EmptyState icon={GitBranch} title="No pipeline" description="Run the pipeline first." />;
  const p = result.pipeline;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Pipeline: {p.id}</h3>
        <Badge variant="outline" className={cn("text-[9px] capitalize", p.status === "completed" ? "text-emerald-600" : p.status === "failed" ? "text-rose-600" : "text-sky-600")}>{p.status}</Badge>
      </div>
      <Card><CardContent className="p-3">
        <div className="space-y-2">
          {p.steps.map((step) => {
            const Icon = stageIcon(step.status);
            return (
              <div key={step.stage} className="rounded-md border border-border/60 bg-card p-3 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  <Icon className={cn("h-3.5 w-3.5", step.status === "completed" ? "text-emerald-600" : step.status === "failed" ? "text-rose-600" : step.status === "active" ? "text-sky-600 animate-spin" : "text-muted-foreground")} />
                  <span className="font-mono font-medium text-foreground">{step.stage}</span>
                  <Badge variant="outline" className={cn("text-[9px] capitalize", step.status === "completed" ? "text-emerald-600" : step.status === "failed" ? "text-rose-600" : "text-muted-foreground")}>{step.status}</Badge>
                  {step.startedAt && step.completedAt && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      {new Date(step.completedAt).getTime() - new Date(step.startedAt).getTime()}ms
                    </span>
                  )}
                </div>
                {step.result !== undefined && (
                  <pre className="ff-scroll max-h-32 overflow-auto rounded bg-muted/30 p-2 text-[10px] font-mono text-muted-foreground whitespace-pre-wrap">{formatResult(step.result)}</pre>
                )}
              </div>
            );
          })}
        </div>
      </CardContent></Card>
    </div>
  );
}

function formatResult(result: unknown): string {
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

// ─── Root Cause View ────────────────────────────────────────────────────

function RootCauseView() {
  const { result } = useAutonomousStore();
  if (!result?.rootCause) return <EmptyState icon={Activity} title="No root cause" description="Run the pipeline first." />;
  const rc = result.rootCause;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Root Cause Analysis</h3>
        <Badge variant="outline" className={cn("text-[9px]", scoreColor(rc.confidence))}>{(rc.confidence * 100).toFixed(0)}% confidence</Badge>
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Root Cause</h4>
        <p className="text-sm text-foreground leading-relaxed">{rc.rootCause}</p>
      </CardContent></Card>
      {rc.contributingFactors.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Contributing Factors</h4>
          <ul className="space-y-0.5">{rc.contributingFactors.map((f: string, i: number) => <li key={i} className="text-xs text-foreground">• {f}</li>)}</ul>
        </CardContent></Card>
      )}
      {rc.evidence.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-emerald-600">Evidence</h4>
          <ul className="space-y-0.5">{rc.evidence.map((e: string, i: number) => <li key={i} className="text-xs text-foreground">✓ {e}</li>)}</ul>
        </CardContent></Card>
      )}
      {rc.alternatives.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-amber-600">Alternatives</h4>
          <ul className="space-y-0.5">{rc.alternatives.map((a: string, i: number) => <li key={i} className="text-xs text-foreground">→ {a}</li>)}</ul>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Patch Planner ──────────────────────────────────────────────────────

function PatchView() {
  const { result } = useAutonomousStore();
  if (!result?.repairPlan) return <EmptyState icon={Eye} title="No repair plan" description="Run the pipeline first." />;
  const plan = result.repairPlan;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Repair Plan ({plan.candidates.length} candidates)</h3>
      <p className="text-xs text-muted-foreground">{plan.rationale}</p>
      <div className="space-y-2">
        {plan.candidates.map((c: any) => {
          const isSelected = c.id === plan.selectedCandidateId;
          return (
            <Card key={c.id} className={cn(isSelected && "border-primary")}>
              <CardContent className="p-3 text-xs">
                <div className="mb-1 flex items-center gap-2">
                  {isSelected && <Badge variant="outline" className="text-[9px] text-emerald-600">selected</Badge>}
                  <Badge variant="outline" className={cn("text-[9px]", riskColor(c.riskLevel))}>{c.riskLevel}</Badge>
                  <Badge variant="outline" className="text-[9px]">{c.estimatedComplexity}</Badge>
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground">{(c.failureProbability * 100).toFixed(0)}% fail</span>
                </div>
                <p className="text-muted-foreground">{c.description}</p>
                <p className="mt-1 text-emerald-600 dark:text-emerald-400">→ {c.expectedOutcome}</p>
                {c.sideEffects.length > 0 && (
                  <div className="mt-1">
                    <span className="text-[10px] text-amber-600">Side effects:</span>
                    <ul className="ml-3 space-y-0.5">{c.sideEffects.map((s: string, i: number) => <li key={i} className="text-[10px] text-muted-foreground">• {s}</li>)}</ul>
                  </div>
                )}
                <div className="mt-1 text-[10px] text-muted-foreground">Files: {c.affectedFiles.join(", ")}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── Simulation View ────────────────────────────────────────────────────

function SimulationView() {
  const { result } = useAutonomousStore();
  if (!result?.simulation) return <EmptyState icon={Shield} title="No simulation" description="Run the pipeline first." />;
  const sim = result.simulation;
  const val = result.validation;
  const conf = result.confidence;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Simulation & Validation</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Success Prob." value={<span className={scoreColor(sim.successProbability)}>{(sim.successProbability * 100).toFixed(0)}%</span>} />
        <Metric label="Failure Prob." value={<span className={scoreColor(1 - sim.failureProbability)}>{(sim.failureProbability * 100).toFixed(0)}%</span>} />
        <Metric label="Validation" value={<span className={val?.valid ? "text-emerald-600" : "text-rose-600"}>{val?.valid ? "Pass" : "Fail"}</span>} />
        <Metric label="Confidence" value={<span className={scoreColor(conf?.repairConfidence ?? 0)}>{((conf?.repairConfidence ?? 0) * 100).toFixed(0)}%</span>} />
      </div>
      {sim.warnings.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-amber-600">Warnings</h4>
          <ul className="space-y-0.5">{sim.warnings.map((w: string, i: number) => <li key={i} className="text-xs text-amber-600 dark:text-amber-400">⚠ {w}</li>)}</ul>
        </CardContent></Card>
      )}
      {val?.checks && val.checks.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Validation Checks ({val.checks.length})</h4>
          <div className="space-y-1">
            {val.checks.map((c: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                {c.passed ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
                <span className="font-medium text-foreground">{c.name}</span>
                <span className="text-[10px] text-muted-foreground">{c.message}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {conf?.factors && conf.factors.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Confidence Factors</h4>
          <div className="space-y-1">
            {conf.factors.map((f: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 text-muted-foreground">{f.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-primary" style={{ width: `${f.value * 100}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-[10px] text-muted-foreground">{(f.value * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Verification View ──────────────────────────────────────────────────

function VerificationView() {
  const { result } = useAutonomousStore();
  if (!result?.verification) return <EmptyState icon={CheckCircle2} title="No verification" description="Run the pipeline first." />;
  const v = result.verification;
  const r = result.regression;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Verification & Regression</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Before Score" value={v.beforeScore} />
        <Metric label="After Score" value={<span className="text-emerald-600">{v.afterScore}</span>} />
        <Metric label="Issue Resolved" value={v.issueResolved ? <span className="text-emerald-600">Yes</span> : <span className="text-rose-600">No</span>} />
        <Metric label="Perf Maintained" value={v.performanceMaintained ? <span className="text-emerald-600">Yes</span> : <span className="text-rose-600">No</span>} />
      </div>
      <Card><CardContent className="p-3">
        <h4 className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Summary</h4>
        <p className="text-xs text-foreground">{v.summary}</p>
      </CardContent></Card>
      {r && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Regression Report</h4>
          {r.issues.length === 0 ? (
            <p className="text-xs text-emerald-600">✓ No regressions detected.</p>
          ) : (
            <div className="space-y-1">
              {r.issues.map((issue: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <Badge variant="outline" className={cn("text-[9px]", issue.severity === "critical" ? "text-rose-600" : issue.severity === "high" ? "text-orange-600" : "text-amber-600")}>{issue.severity}</Badge>
                  <Badge variant="outline" className="text-[9px]">{issue.type}</Badge>
                  <span className="text-foreground">{issue.description}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Quality Review ─────────────────────────────────────────────────────

function ReviewPanel() {
  const { review, refreshReview } = useAutonomousStore();
  React.useEffect(() => { void refreshReview(); }, [refreshReview]);
  if (!review) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  const q = review.quality;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Quality Review</h3>
      {q && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Overall" value={<span className={scoreColor(q.overall / 100)}>{q.overall}</span>} />
          <Metric label="Maintainability" value={q.maintainability} />
          <Metric label="Complexity" value={q.complexity} />
          <Metric label="Performance" value={q.performance} />
          <Metric label="Accessibility" value={q.accessibility} />
          <Metric label="Architecture" value={q.architecture} />
        </div>
      )}
      {review.findings.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Findings ({review.findings.length})</h4>
          <div className="space-y-1.5">
            {review.findings.map((f: any, i: number) => (
              <div key={i} className="rounded-md border border-border/60 bg-card p-2 text-xs">
                <div className="mb-0.5 flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", f.severity === "error" ? "text-rose-600" : f.severity === "warning" ? "text-amber-600" : "text-sky-600")}>{f.severity}</Badge>
                  <Badge variant="outline" className="text-[9px]">{f.category}</Badge>
                </div>
                <p className="text-foreground">{f.message}</p>
                <p className="mt-0.5 text-emerald-600 dark:text-emerald-400">→ {f.suggestion}</p>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── Learning Panel ─────────────────────────────────────────────────────

function LearningPanel() {
  const { learning, learningRecords, refreshLearning } = useAutonomousStore();
  React.useEffect(() => { void refreshLearning(); }, [refreshLearning]);
  if (!learning) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Learning Engine</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshLearning()}>
          <Activity className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Metric label="Total Repairs" value={learning.totalRepairs} />
        <Metric label="Success Rate" value={<span className={scoreColor(learning.successRate)}>{(learning.successRate * 100).toFixed(0)}%</span>} />
        <Metric label="Strategies" value={learning.commonStrategies.length} />
      </div>
      {learning.commonStrategies.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Strategies</h4>
          <div className="space-y-1">
            {learning.commonStrategies.map((s, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground">{s.strategy}</span>
                <span className="text-[10px] text-muted-foreground">{s.count}×</span>
                <span className={cn("text-[10px]", scoreColor(s.successRate))}>{(s.successRate * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {learning.commonIssues.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Issues</h4>
          <div className="space-y-1">
            {learning.commonIssues.map((iss, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="flex-1 truncate text-foreground">{iss.category}</span>
                <span className="text-[10px] text-muted-foreground">{iss.count}×</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
      {learningRecords.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Recent Records ({learningRecords.length})</h4>
          <div className="max-h-60 space-y-1 overflow-y-auto ff-scroll">
            {learningRecords.slice(0, 20).map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-[10px]">
                {r.success ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
                <span className="truncate text-foreground">{r.repairStrategy}</span>
                <span className="ml-auto text-muted-foreground">{new Date(r.learnedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

// ─── History ────────────────────────────────────────────────────────────

function HistoryPanel() {
  const { history, refreshHistory } = useAutonomousStore();
  React.useEffect(() => { void refreshHistory(); }, [refreshHistory]);
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Repair History ({history.length})</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshHistory()}>
          <History className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      {history.length === 0 ? (
        <EmptyState icon={History} title="No history" description="Run the pipeline to see history." />
      ) : (
        <div className="space-y-1.5">
          {history.map((h) => (
            <div key={h.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
              {h.success ? <CheckCircle2 className="h-3 w-3 text-emerald-600" /> : <XCircle className="h-3 w-3 text-rose-600" />}
              <Badge variant="outline" className="text-[9px]">{h.category}</Badge>
              <span className="truncate text-foreground">{h.problemTitle}</span>
              {h.rolledBack && <Badge variant="outline" className="text-[9px] text-amber-600">rolled back</Badge>}
              <span className="ml-auto text-[10px] text-muted-foreground">{(h.confidence * 100).toFixed(0)}% · {h.durationMs}ms · {new Date(h.timestamp).toLocaleTimeString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Metrics ────────────────────────────────────────────────────────────

function MetricsPanel() {
  const { metrics, refreshMetrics } = useAutonomousStore();
  React.useEffect(() => { void refreshMetrics(); }, [refreshMetrics]);
  if (!metrics) return <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Autonomous Metrics</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => void refreshMetrics()}>
          <BarChart3 className="mr-1 h-3 w-3" />Refresh
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Problems" value={metrics.totalProblems} />
        <Metric label="Total Repairs" value={metrics.totalRepairs} />
        <Metric label="Success Rate" value={<span className={scoreColor(metrics.successRate)}>{(metrics.successRate * 100).toFixed(0)}%</span>} />
        <Metric label="Avg Confidence" value={<span className={scoreColor(metrics.averageConfidence)}>{(metrics.averageConfidence * 100).toFixed(0)}%</span>} />
        <Metric label="Rollbacks" value={metrics.rollbackCount} />
        <Metric label="Avg Duration" value={`${metrics.averageDurationMs}ms`} />
      </div>
      {metrics.commonProblemCategories.length > 0 && (
        <Card><CardContent className="p-3">
          <h4 className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Common Problem Categories</h4>
          <div className="space-y-1">
            {metrics.commonProblemCategories.map((c) => (
              <div key={c.category} className="flex items-center gap-2 text-xs">
                <span className="flex-1 text-foreground">{c.category}</span>
                <div className="h-2 w-24 overflow-hidden rounded bg-muted">
                  <div className="h-full rounded bg-amber-500" style={{ width: `${(c.count / metrics.totalProblems) * 100}%` }} />
                </div>
                <span className="w-8 text-right text-[10px] text-muted-foreground">{c.count}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
