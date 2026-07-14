"use client";

import * as React from "react";
import {
  Wand2, Network, Eye, ShieldAlert, Zap, Lightbulb, BarChart3,
  Play, Loader2, Send, RefreshCw, Cpu, Sparkles, type LucideIcon,
  CheckCircle2, XCircle, SkipForward, RotateCcw,
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
import {
  useToolIntelligenceStore, stepStatusColor,
} from "@/stores";
import { useTIMetricsStore } from "@/stores";
import type { ToolChain, ChainStep, SimulationResult, Recommendation } from "@/features/tool-intelligence/types";
import type {
  ChainExecution, StepExecution,
} from "@/features/tool-intelligence/state/execution-types";
import { riskColor, riskLabel } from "@/features/tool-intelligence/risk";
import { formatCost } from "@/features/tool-intelligence/cost";
import { recommendationKindMeta } from "@/features/tool-intelligence/recommendations";
import { listRecoveryActions } from "@/features/tool-intelligence/recovery";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Wand2 },
  { id: "execution", label: "Execution", icon: Cpu },
  { id: "chain", label: "Chain Viewer", icon: Network },
  { id: "simulation", label: "Simulation", icon: Eye },
  { id: "recovery", label: "Recovery", icon: ShieldAlert },
  { id: "optimization", label: "Optimization", icon: Zap },
  { id: "recommendations", label: "Recommendations", icon: Lightbulb },
  { id: "risk", label: "Risk Dashboard", icon: BarChart3 },
  { id: "learning", label: "Learning", icon: Sparkles },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function ToolIntelligencePage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const hydrateMetrics = useTIMetricsStore((s) => s.hydrate);
  const fetchLearning = useToolIntelligenceStore((s) => s.fetchLearning);
  const fetchExecutions = useToolIntelligenceStore((s) => s.fetchExecutions);

  React.useEffect(() => {
    hydrateMetrics();
    fetchLearning();
    fetchExecutions();
  }, [hydrateMetrics, fetchLearning, fetchExecutions]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 overflow-x-auto border-b border-border bg-muted/20 px-2 ff-scroll">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setActive(t.id)}
              className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                active === t.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>
      <div className="min-h-0 flex-1">
        {active === "dashboard" && <Dashboard />}
        {active === "execution" && <ExecutionPanel />}
        {active === "chain" && <ChainViewer />}
        {active === "simulation" && <SimulationPanel />}
        {active === "recovery" && <RecoveryCenter />}
        {active === "optimization" && <OptimizationPanel />}
        {active === "recommendations" && <Recommendations />}
        {active === "risk" && <RiskDashboard />}
        {active === "learning" && <LearningPanel />}
      </div>
    </div>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────

function Metric({ label, value, sub, className }: { label: string; value: React.ReactNode; sub?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border/60 bg-muted/30 p-3", className)}>
      <div className="text-lg font-semibold text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground">{sub}</div>}
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

function Dashboard() {
  const {
    objective, setObjective, intentType, setIntentType,
    chain, recommendations, rationale, aiGenerated,
    loading, error, buildChain, simulate, optimize, execute, executing,
  } = useToolIntelligenceStore();

  const handleAnalyze = async () => {
    await buildChain();
    toast.success("Tool chain built", {
      description: aiGenerated ? "AI-generated chain ready" : undefined,
    });
  };

  const handleExecute = async () => {
    toast.info("Executing chain…");
    await execute();
    const exec = useToolIntelligenceStore.getState().execution;
    if (exec) {
      if (exec.status === "completed") {
        toast.success(`Chain executed — ${exec.successCount}/${exec.steps.length} steps succeeded`);
      } else if (exec.status === "partial") {
        toast.warning(`Partial execution — ${exec.successCount} succeeded, ${exec.failureCount} failed`);
      } else {
        toast.error(`Execution failed — ${exec.failureCount} steps failed`);
      }
    }
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Wand2 className="h-3.5 w-3.5" /> Analyze Objective
          </h4>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input value={objective} onChange={(e) => setObjective(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleAnalyze()}
              placeholder="Describe the objective… (e.g. 'Add a login screen with email + password fields')"
              className="flex-1" autoFocus />
            <Select value={intentType} onValueChange={(v) => setIntentType(v as any)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="feature-request">Feature Request</SelectItem>
                <SelectItem value="bug-fix">Bug Fix</SelectItem>
                <SelectItem value="generate-ui">Generate UI</SelectItem>
                <SelectItem value="refactor">Refactor</SelectItem>
                <SelectItem value="code-review">Code Review</SelectItem>
                <SelectItem value="analyze-project">Analyze Project</SelectItem>
                <SelectItem value="testing">Testing</SelectItem>
                <SelectItem value="deployment">Deployment</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleAnalyze} disabled={loading || !objective.trim()}>
              {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
              Analyze
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {chain && (
        <>
          {/* AI Analysis panel */}
          <Card>
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" /> AI Analysis
                </h4>
                {aiGenerated ? (
                  <Badge variant="outline" className="text-[9px] text-violet-600 dark:text-violet-400">AI-generated</Badge>
                ) : (
                  <Badge variant="outline" className="text-[9px] text-muted-foreground">Template fallback</Badge>
                )}
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                {rationale || "Chain built from intent-type defaults."}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Steps" value={chain.steps.length} />
            <Metric label="Risk Score" value={<span className={riskColor(chain.riskScore)}>{chain.riskScore.toFixed(2)}</span>} sub={riskLabel(chain.riskScore)} />
            <Metric label="Est. Duration" value={chain.totalEstimatedDurationMs < 1000 ? `${chain.totalEstimatedDurationMs}ms` : `${(chain.totalEstimatedDurationMs / 1000).toFixed(1)}s`} />
            <Metric label="Est. Tokens" value={chain.totalEstimatedTokens} />
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Tool Chain</h4>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={simulate} disabled={loading}>
                    <Eye className="mr-1 h-3 w-3" />Simulate
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={optimize} disabled={loading}>
                    <Zap className="mr-1 h-3 w-3" />Optimize
                  </Button>
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={handleExecute} disabled={executing}>
                    {executing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
                    Execute
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                {chain.steps.map((step, i) => <StepRow key={step.id} step={step} index={i} />)}
              </div>
              <Separator className="my-3" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Cost: {formatCost(chain.costEstimate)}</span>
                <span>·</span>
                <span>Rollback: {chain.rollbackStrategy}</span>
              </div>
            </CardContent>
          </Card>

          {recommendations.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recommendations</h4>
                <div className="space-y-1.5">
                  {recommendations.map((r) => <RecRow key={r.id} rec={r} />)}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!chain && !loading && (
        <EmptyState icon={Wand2} title="Analyze an objective"
          description="Enter an objective and the Tool Intelligence Layer will use the AI Chat Engine to build an optimal tool chain, then estimate costs and assess risk." />
      )}
    </div>
  );
}

function StepRow({ step, index }: { step: ChainStep; index: number }) {
  const typeIcons: Record<string, string> = { sequential: "→", parallel: "⇄", conditional: "?", fallback: "↩", approval: "⚠" };
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{index + 1}</span>
      <span className="text-muted-foreground">{typeIcons[step.type] ?? "→"}</span>
      <span className="font-mono text-foreground">{step.toolId}</span>
      {step.requiresApproval && <Badge variant="outline" className="text-[9px] text-amber-600">approval</Badge>}
      {step.fallbacks.length > 0 && <Badge variant="outline" className="text-[9px]">{step.fallbacks.length} fallbacks</Badge>}
      {step.parallelGroup && <Badge variant="outline" className="text-[9px] text-sky-600">parallel</Badge>}
      <span className="ml-auto text-[10px] text-muted-foreground">{step.estimatedDurationMs}ms · {step.estimatedTokens}t</span>
    </div>
  );
}

function RecRow({ rec }: { rec: Recommendation }) {
  const meta = recommendationKindMeta(rec.kind);
  return (
    <div className="flex items-start gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs">
      <span className="text-base">{meta.icon}</span>
      <div className="flex-1">
        <span className={cn("font-medium", meta.color)}>{rec.title}</span>
        <p className="mt-0.5 text-muted-foreground">{rec.description}</p>
      </div>
    </div>
  );
}

// ─── Execution Panel (REAL EXECUTION) ───────────────────────────────────

function ExecutionPanel() {
  const { chain, execution, executions, executing, execute } = useToolIntelligenceStore();
  if (!chain) return <EmptyState icon={Cpu} title="No chain to execute" description="Build a chain from the Dashboard first." />;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Real Execution</h3>
        <Button size="sm" variant="default" className="h-7 text-xs" onClick={execute} disabled={executing}>
          {executing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          {executing ? "Executing…" : "Execute Chain"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Each step is dispatched to the Execution Engine, which validates permissions, runs the tool, generates patches, records history, and emits events. Failures trigger automatic recovery (retry / alternative / rollback / skip / escalate).
      </p>

      {execution ? <ExecutionDetail exec={execution} /> : (
        <EmptyState icon={Cpu} title="No execution yet"
          description="Click Execute Chain to run the chain against the Execution Engine." />
      )}

      {executions.length > 1 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Execution History</h4>
            <div className="max-h-96 space-y-1.5 overflow-y-auto ff-scroll">
              {executions.map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2 text-xs">
                  <Badge variant="outline" className={cn("text-[9px] capitalize", execStatusColor(e.status))}>{e.status}</Badge>
                  <span className="font-mono text-foreground truncate flex-1">{e.objective}</span>
                  <span className="text-[10px] text-muted-foreground">{e.successCount}/{e.steps.length} ok</span>
                  <span className="text-[10px] text-muted-foreground">{(e.durationMs / 1000).toFixed(2)}s</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ExecutionDetail({ exec }: { exec: ChainExecution }) {
  const progress = exec.steps.length === 0
    ? 0
    : Math.round(
        (exec.steps.filter((s) => s.status === "success" || s.status === "failed" || s.status === "skipped" || s.status === "rolled-back").length /
          exec.steps.length) * 100);

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Progress" value={`${progress}%`} />
        <Metric label="Succeeded" value={<span className="text-emerald-600 dark:text-emerald-400">{exec.successCount}</span>} />
        <Metric label="Failed" value={<span className="text-rose-600 dark:text-rose-400">{exec.failureCount}</span>} />
        <Metric label="Skipped" value={<span className="text-muted-foreground">{exec.skippedCount}</span>} />
        <Metric label="Duration" value={`${(exec.durationMs / 1000).toFixed(2)}s`} />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Step Results</h4>
            <Badge variant="outline" className={cn("text-[9px] capitalize", execStatusColor(exec.status))}>{exec.status}</Badge>
          </div>
          <div className="space-y-2">
            {exec.steps.map((s, i) => <StepResultRow key={s.stepId} step={s} index={i} />)}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function StepResultRow({ step, index }: { step: StepExecution; index: number }) {
  const output = step.result?.output;
  return (
    <div className="rounded-md border border-border/60 bg-card p-3 text-xs">
      <div className="mb-1 flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{index + 1}</span>
        {renderStepIcon(step.status)}
        <span className="font-mono text-foreground">{step.toolId}</span>
        <Badge variant="outline" className={cn("text-[9px] capitalize", stepStatusColor(step.status))}>{step.status}</Badge>
        {step.durationMs !== undefined && (
          <span className="ml-auto text-[10px] text-muted-foreground">{(step.durationMs / 1000).toFixed(2)}s</span>
        )}
      </div>
      {step.error && <p className="ml-7 mb-1 text-[11px] text-rose-600 dark:text-rose-400">Error: {step.error}</p>}
      {step.recoveryAttempts && step.recoveryAttempts.length > 0 && (
        <div className="ml-7 mb-1 space-y-0.5">
          {step.recoveryAttempts.map((a, i) => (
            <div key={i} className="text-[10px] text-amber-600 dark:text-amber-400">
              ↩ Recovery ({a.action}): {a.message}
            </div>
          ))}
        </div>
      )}
      {output !== undefined && (
        <pre className="ml-7 max-h-32 overflow-auto rounded bg-muted/50 p-2 text-[10px] text-muted-foreground ff-scroll">
          {formatOutput(output)}
        </pre>
      )}
    </div>
  );
}

/** Render the right icon element for a step status (avoids creating a component during render). */
function renderStepIcon(status: StepExecution["status"]) {
  const className = cn("h-3.5 w-3.5", stepStatusColor(status));
  switch (status) {
    case "success": return <CheckCircle2 className={className} />;
    case "failed": return <XCircle className={className} />;
    case "skipped": return <SkipForward className={className} />;
    case "rolled-back": return <RotateCcw className={className} />;
    case "running": return <Loader2 className={cn(className, "animate-spin")} />;
    default: return <Loader2 className={className} />;
  }
}

function formatOutput(output: unknown): string {
  if (typeof output === "string") return output;
  try {
    return JSON.stringify(output, null, 2);
  } catch {
    return String(output);
  }
}

function execStatusColor(status: ChainExecution["status"]): string {
  switch (status) {
    case "completed": return "text-emerald-600 dark:text-emerald-400";
    case "partial": return "text-amber-600 dark:text-amber-400";
    case "failed": return "text-rose-600 dark:text-rose-400";
    case "running": return "text-sky-600 dark:text-sky-400";
    default: return "text-muted-foreground";
  }
}

// ─── Chain Viewer ───────────────────────────────────────────────────────

function ChainViewer() {
  const { chain } = useToolIntelligenceStore();
  if (!chain) return <EmptyState icon={Network} title="No chain to view" description="Build a chain from the Dashboard." />;
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Chain: {chain.objective}</h3>
      <div className="space-y-2">
        {chain.steps.map((step, i) => (
          <div key={step.id} className="rounded-lg border border-border/60 bg-card p-3">
            <div className="mb-1 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
              <span className="font-mono text-sm text-foreground">{step.toolId}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{step.type}</Badge>
              {step.requiresApproval && <Badge variant="outline" className="text-[9px] text-amber-600">approval</Badge>}
            </div>
            <div className="ml-8 space-y-1 text-[10px] text-muted-foreground">
              <div>Duration: {step.estimatedDurationMs}ms · Tokens: {step.estimatedTokens}</div>
              {step.dependsOn.length > 0 && <div>Depends on: {step.dependsOn.join(", ")}</div>}
              {step.fallbacks.length > 0 && <div>Fallbacks: {step.fallbacks.join(", ")}</div>}
              {step.parallelGroup && <div>Parallel group: {step.parallelGroup}</div>}
              {step.condition && <div>Condition: {step.condition}</div>}
            </div>
          </div>
        ))}
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Steps" value={chain.steps.length} />
        <Metric label="Risk" value={<span className={riskColor(chain.riskScore)}>{chain.riskScore.toFixed(2)}</span>} />
        <Metric label="Duration" value={`${(chain.totalEstimatedDurationMs / 1000).toFixed(1)}s`} />
        <Metric label="Tokens" value={chain.totalEstimatedTokens} />
      </div>
    </div>
  );
}

// ─── Simulation Panel ───────────────────────────────────────────────────

function SimulationPanel() {
  const { chain, simulation, simulate, loading } = useToolIntelligenceStore();
  if (!chain) return <EmptyState icon={Eye} title="No chain to simulate" description="Build a chain from the Dashboard first." />;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Simulation (Dry Run)</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={simulate} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Play className="mr-1 h-3 w-3" />}
          Run Simulation
        </Button>
      </div>

      {simulation ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Predicted Duration" value={`${(simulation.predictedDurationMs / 1000).toFixed(1)}s`} />
            <Metric label="Predicted Tokens" value={simulation.predictedTokens} />
            <Metric label="Predicted Risk" value={<span className={riskColor(simulation.predictedRisk)}>{simulation.predictedRisk.toFixed(2)}</span>} />
            <Metric label="Approval Required" value={simulation.approvalRequired ? "Yes" : "No"} />
          </div>

          {simulation.warnings.length > 0 && (
            <Card><CardContent className="p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-600">Warnings</h4>
              <div className="space-y-1">{simulation.warnings.map((w, i) => <div key={i} className="text-xs text-amber-600 dark:text-amber-400">⚠ {w}</div>)}</div>
            </CardContent></Card>
          )}

          <Card><CardContent className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Predicted Outputs</h4>
            <div className="space-y-1">
              {simulation.predictedOutputs.map((o) => (
                <div key={o.stepId} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-foreground">{o.toolId}</span>
                  <span className="text-muted-foreground">→ {o.predictedOutput}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>

          {simulation.predictedPatches.length > 0 && (
            <Card><CardContent className="p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Predicted Patches</h4>
              <div className="space-y-1">
                {simulation.predictedPatches.map((p) => (
                  <div key={p.stepId} className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-foreground">{p.path}</span>
                    <Badge variant="outline" className="text-[9px] text-emerald-600">+{p.linesAdded}</Badge>
                    <Badge variant="outline" className="text-[9px] text-rose-600">-{p.linesRemoved}</Badge>
                  </div>
                ))}
              </div>
            </CardContent></Card>
          )}
        </>
      ) : (
        <EmptyState icon={Eye} title="Run a simulation" description="Simulate the chain to predict outputs, patches, duration, and risk without modifying the project." />
      )}
    </div>
  );
}

// ─── Recovery Center ────────────────────────────────────────────────────

function RecoveryCenter() {
  const actions = listRecoveryActions();
  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Recovery Strategies</h3>
      <p className="text-xs text-muted-foreground">When a tool fails, the Recovery Engine automatically chooses one of these strategies:</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {actions.map((a) => (
          <Card key={a.action}><CardContent className="p-4">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="outline" className="text-[9px] capitalize">{a.action}</Badge>
              <span className="text-sm font-medium text-foreground">{a.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{a.description}</p>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Recovery Flow</h4>
        <div className="space-y-1 text-xs text-muted-foreground">
          <div>1. Tool fails → Recovery Engine evaluates the failure</div>
          <div>2. If transient (timeout/network) → <span className="text-foreground">Retry</span> (up to max retries)</div>
          <div>3. If fallback available → <span className="text-foreground">Alternative tool</span></div>
          <div>4. If side effects → <span className="text-foreground">Rollback</span> via snapshot restore</div>
          <div>5. If non-critical → <span className="text-foreground">Skip</span> and continue</div>
          <div>6. If critical → <span className="text-foreground">Escalate</span> to the Planner for re-planning</div>
        </div>
      </CardContent></Card>
    </div>
  );
}

// ─── Optimization Panel ─────────────────────────────────────────────────

function OptimizationPanel() {
  const { chain, optimizedChain, optimize, loading } = useToolIntelligenceStore();
  if (!chain) return <EmptyState icon={Zap} title="No chain to optimize" description="Build a chain from the Dashboard first." />;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Optimization</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={optimize} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Zap className="mr-1 h-3 w-3" />}
          Optimize Chain
        </Button>
      </div>

      {optimizedChain ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Original Steps" value={chain.steps.length} />
            <Metric label="Optimized Steps" value={optimizedChain.steps.length} />
            <Metric label="Time Saved" value={`${Math.max(0, chain.totalEstimatedDurationMs - optimizedChain.totalEstimatedDurationMs)}ms`} />
            <Metric label="Tokens Saved" value={Math.max(0, chain.totalEstimatedTokens - optimizedChain.totalEstimatedTokens)} />
          </div>

          <Card><CardContent className="p-4">
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Optimized Chain</h4>
            <div className="space-y-1.5">
              {optimizedChain.steps.map((step, i) => <StepRow key={step.id} step={step} index={i} />)}
            </div>
          </CardContent></Card>
        </>
      ) : (
        <EmptyState icon={Zap} title="Click Optimize" description="The optimizer reduces tool count, parallelizes independent steps, and minimizes token usage." />
      )}
    </div>
  );
}

// ─── Recommendations ────────────────────────────────────────────────────

function Recommendations() {
  const { recommendations, chain } = useToolIntelligenceStore();
  if (!chain) return <EmptyState icon={Lightbulb} title="No recommendations yet" description="Build a chain from the Dashboard first." />;
  if (recommendations.length === 0) return <EmptyState icon={Lightbulb} title="No recommendations" description="The chain is already well-optimized. Try a more complex objective." />;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Recommendations ({recommendations.length})</h3>
      {recommendations.map((r) => {
        const meta = recommendationKindMeta(r.kind);
        return (
          <Card key={r.id}><CardContent className="p-4">
            <div className="mb-2 flex items-start gap-2">
              <span className="text-xl">{meta.icon}</span>
              <div className="flex-1">
                <span className={cn("text-sm font-medium", meta.color)}>{r.title}</span>
                <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
              </div>
            </div>
            {r.improvements.timeSavedMs !== undefined && r.improvements.timeSavedMs > 0 && (
              <Badge variant="outline" className="text-[9px] text-sky-600">⚡ {r.improvements.timeSavedMs}ms saved</Badge>
            )}
            {r.improvements.tokensSaved !== undefined && r.improvements.tokensSaved > 0 && (
              <Badge variant="outline" className="ml-1 text-[9px] text-amber-600">💰 {r.improvements.tokensSaved} tokens saved</Badge>
            )}
            {r.improvements.riskReduced !== undefined && r.improvements.riskReduced > 0 && (
              <Badge variant="outline" className="ml-1 text-[9px] text-emerald-600">🛡️ {(r.improvements.riskReduced * 100).toFixed(0)}% risk reduced</Badge>
            )}
          </CardContent></Card>
        );
      })}
    </div>
  );
}

// ─── Risk Dashboard ─────────────────────────────────────────────────────

function RiskDashboard() {
  const { chain } = useToolIntelligenceStore();

  if (!chain) return <EmptyState icon={BarChart3} title="No risk data" description="Build a chain from the Dashboard first." />;

  const dimensions = [
    { label: "Filesystem", value: chain.costEstimate.workspaceChanges > 0 ? 0.5 : 0.1, color: "bg-emerald-500" },
    { label: "Terminal", value: 0.1, color: "bg-emerald-500" },
    { label: "Flutter", value: chain.steps.some((s) => s.toolId.startsWith("flutter.")) ? 0.4 : 0.1, color: "bg-amber-500" },
    { label: "Git", value: chain.steps.some((s) => s.toolId.startsWith("git.")) ? 0.3 : 0.1, color: "bg-emerald-500" },
    { label: "Network", value: 0.1, color: "bg-emerald-500" },
    { label: "Project Impact", value: chain.steps.filter((s) => s.requiresApproval).length * 0.3, color: "bg-amber-500" },
  ];

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Risk Dashboard</h3>

      <Card><CardContent className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall Risk</h4>
          <span className={cn("text-2xl font-bold", riskColor(chain.riskScore))}>{chain.riskScore.toFixed(2)}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-muted">
          <div className={cn("h-full rounded-full transition-all", chain.riskScore < 0.2 ? "bg-emerald-500" : chain.riskScore < 0.4 ? "bg-amber-500" : chain.riskScore < 0.7 ? "bg-orange-500" : "bg-rose-500")} style={{ width: `${chain.riskScore * 100}%` }} />
        </div>
        <p className={cn("mt-2 text-xs", riskColor(chain.riskScore))}>{riskLabel(chain.riskScore)} risk</p>
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk by Dimension</h4>
        <div className="space-y-2">
          {dimensions.map((d) => (
            <div key={d.label} className="flex items-center gap-2 text-xs">
              <span className="w-24 shrink-0 text-muted-foreground">{d.label}</span>
              <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                <div className={cn("h-full rounded", d.color)} style={{ width: `${Math.min(100, d.value * 100)}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-foreground">{(d.value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </CardContent></Card>

      <Card><CardContent className="p-4">
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Risk Factors</h4>
        {chain.steps.filter((s) => s.requiresApproval).length === 0 ? (
          <p className="text-xs text-muted-foreground">No risk factors — chain is safe.</p>
        ) : (
          <div className="space-y-1">
            {chain.steps.filter((s) => s.requiresApproval).map((s) => (
              <div key={s.id} className="text-xs text-amber-600 dark:text-amber-400">⚠ {s.toolId} requires approval</div>
            ))}
          </div>
        )}
      </CardContent></Card>
    </div>
  );
}

// ─── Learning Panel ─────────────────────────────────────────────────────

function LearningPanel() {
  const { learningSummaries, fetchLearning } = useToolIntelligenceStore();
  const [loading, setLoading] = React.useState(false);

  const refresh = async () => {
    setLoading(true);
    await fetchLearning();
    setLoading(false);
  };

  React.useEffect(() => { void refresh(); }, []);

  const sorted = [...learningSummaries].sort((a, b) => b.totalUses - a.totalUses);

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tool Learning</h3>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <RefreshCw className="mr-1 h-3 w-3" />}
          Refresh
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Real execution outcomes recorded by the Learning Store. Used by the Tool Selector to improve future tool choices.
      </p>

      {sorted.length === 0 ? (
        <EmptyState icon={Sparkles} title="No learning data yet"
          description="Execute a chain from the Execution tab — every successful or failed step is recorded here." />
      ) : (
        <Card><CardContent className="p-4">
          <div className="max-h-[28rem] overflow-y-auto ff-scroll">
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-card">
                <tr className="text-left text-[10px] uppercase text-muted-foreground">
                  <th className="pb-2 pr-2">Tool</th>
                  <th className="pb-2 pr-2">Uses</th>
                  <th className="pb-2 pr-2">Success</th>
                  <th className="pb-2 pr-2">Failed</th>
                  <th className="pb-2 pr-2">Avg ms</th>
                  <th className="pb-2">Reliability</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((s) => (
                  <tr key={s.toolId} className="border-t border-border/40">
                    <td className="py-1.5 pr-2 font-mono text-foreground">{s.toolId}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.totalUses}</td>
                    <td className="py-1.5 pr-2 text-emerald-600 dark:text-emerald-400">{s.successCount}</td>
                    <td className="py-1.5 pr-2 text-rose-600 dark:text-rose-400">{s.failureCount}</td>
                    <td className="py-1.5 pr-2 text-muted-foreground">{s.averageDurationMs}</td>
                    <td className="py-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2 w-16 overflow-hidden rounded bg-muted">
                          <div
                            className={cn(
                              "h-full rounded",
                              s.reliability > 0.8 ? "bg-emerald-500" :
                              s.reliability > 0.5 ? "bg-amber-500" : "bg-rose-500"
                            )}
                            style={{ width: `${Math.round(s.reliability * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{(s.reliability * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}
