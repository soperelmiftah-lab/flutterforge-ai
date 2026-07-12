"use client";

import * as React from "react";
import {
  Brain, Network, Boxes, GitBranch, Activity, BarChart3, Clock,
  Play, Loader2, Search, RefreshCw, Sparkles, Send, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Metric, EmptyState, TaskStatusBadge, PriorityBadge, AgentStatusBadge, formatDuration } from "@/components/planner/shared";
import { usePlannerStore, useAgentStore, useWorkflowStore, useTimelineStore, useSessionStore, usePlannerMetricsStore } from "@/stores";
import type { Task, AgentDescriptor, Workflow, TimelineEvent } from "@/features/planner/types";
import { toast } from "sonner";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: Brain },
  { id: "graph", label: "Task Graph", icon: Network },
  { id: "workflows", label: "Workflows", icon: GitBranch },
  { id: "agents", label: "Agents", icon: Boxes },
  { id: "thinking", label: "Thinking", icon: Sparkles },
  { id: "timeline", label: "Timeline", icon: Activity },
  { id: "metrics", label: "Metrics", icon: BarChart3 },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function PlannerPage() {
  const [active, setActive] = React.useState<TabId>("dashboard");
  const hydrateAgents = useAgentStore((s) => s.hydrate);
  const hydrateWorkflows = useWorkflowStore((s) => s.hydrate);
  const hydrateTimeline = useTimelineStore((s) => s.hydrate);
  const hydrateMetrics = usePlannerMetricsStore((s) => s.hydrate);

  React.useEffect(() => {
    hydrateAgents();
    hydrateWorkflows();
    hydrateTimeline();
    hydrateMetrics();
  }, [hydrateAgents, hydrateWorkflows, hydrateTimeline, hydrateMetrics]);

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex h-11 shrink-0 items-center gap-1 border-b border-border bg-muted/20 px-2 overflow-x-auto ff-scroll">
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
        {active === "dashboard" && <PlannerDashboard />}
        {active === "graph" && <TaskGraphViewer />}
        {active === "workflows" && <WorkflowExplorer />}
        {active === "agents" && <AgentRegistry />}
        {active === "thinking" && <ThinkingPanel />}
        {active === "timeline" && <TimelineViewer />}
        {active === "metrics" && <MetricsDashboard />}
      </div>
    </div>
  );
}

// ─── Planner Dashboard ──────────────────────────────────────────────────

function PlannerDashboard() {
  const { input, setInput, planRequest, intent, goal, plan, loading, error, executePlan } = usePlannerStore();

  const handlePlan = async () => {
    await planRequest();
    if (!error) toast.success("Plan generated");
  };

  const handleExecute = async () => {
    await executePlan();
    toast.success("Plan executed");
  };

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Brain className="h-3.5 w-3.5" /> Plan a Request
          </h4>
          <div className="flex gap-2">
            <Input value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handlePlan()}
              placeholder="Describe what you want to do… (e.g. 'Add a login screen with email validation')"
              className="flex-1" autoFocus />
            <Button onClick={handlePlan} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
              Plan
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </CardContent>
      </Card>

      {intent && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Intent" value={intent.type} />
          <Metric label="Confidence" value={`${(intent.confidence * 100).toFixed(0)}%`} />
          <Metric label="Tasks" value={plan?.tasks.length ?? 0} />
          <Metric label="Agents" value={plan?.requiredAgents.length ?? 0} />
        </div>
      )}

      {goal && (
        <Card>
          <CardContent className="p-4">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goal</h4>
            <p className="text-sm font-medium text-foreground">{goal.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{goal.description}</p>
            <div className="mt-3 space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Objectives</p>
              {goal.objectives.map((o) => (
                <div key={o.id} className="flex items-center gap-2 text-xs">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-foreground">{o.title}</span>
                  <span className="text-muted-foreground">— {o.description}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {plan && (
        <Card>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Execution Plan</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[9px] capitalize">{plan.strategy.kind}</Badge>
                <Badge variant="outline" className="text-[9px]">{formatDuration(plan.estimatedDurationMs)}</Badge>
                <Button size="sm" className="h-7 text-xs" onClick={handleExecute} disabled={loading}>
                  <Play className="mr-1 h-3 w-3" />Execute
                </Button>
              </div>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{plan.strategy.rationale}</p>
            <div className="space-y-1.5">
              {plan.tasks.map((task, i) => <TaskRow key={task.id} task={task} index={i} />)}
            </div>
          </CardContent>
        </Card>
      )}

      {!intent && (
        <EmptyState icon={Brain} title="Plan your next task" description="Enter a natural-language request and the planner will break it into goals, tasks, and an execution strategy." />
      )}
    </div>
  );
}

function TaskRow({ task, index }: { task: Task; index: number }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{index + 1}</span>
      <TaskStatusBadge status={task.status} />
      <PriorityBadge priority={task.priority} />
      <span className="font-medium text-foreground">{task.title}</span>
      {task.assignedAgentId && <Badge variant="outline" className="text-[9px] font-mono">{task.assignedAgentId.replace("agent.", "")}</Badge>}
      <span className="ml-auto text-[10px] text-muted-foreground">{formatDuration(task.estimatedDurationMs)}</span>
    </div>
  );
}

// ─── Task Graph Viewer ──────────────────────────────────────────────────

function TaskGraphViewer() {
  const { plan } = usePlannerStore();
  const [selected, setSelected] = React.useState<string | null>(null);

  if (!plan) return <EmptyState icon={Network} title="No plan to visualize" description="Generate a plan from the Dashboard to see its task graph." />;

  const tasks = plan.tasks;
  const selectedTask = tasks.find((t) => t.id === selected);

  // Layout: vertical chain based on dependencies.
  const levels = new Map<string, number>();
  const computeLevel = (taskId: string, depth = 0): number => {
    if (levels.has(taskId)) return levels.get(taskId)!;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.dependsOn.length === 0) {
      levels.set(taskId, 0);
      return 0;
    }
    const maxDep = Math.max(...task.dependsOn.map((d) => computeLevel(d, depth + 1)));
    const level = maxDep + 1;
    levels.set(taskId, level);
    return level;
  };
  tasks.forEach((t) => computeLevel(t.id));
  const maxLevel = Math.max(...levels.values(), 0);

  return (
    <div className="flex h-full">
      <div className="relative min-w-0 flex-1 overflow-auto bg-muted/5 p-4">
        <svg width="100%" height={(maxLevel + 1) * 100 + 40} className="min-w-[400px]">
          {/* Edges */}
          {tasks.flatMap((t) => t.dependsOn.map((depId) => {
            const from = tasks.find((x) => x.id === depId);
            const to = t;
            if (!from) return null;
            const x1 = (levels.get(from.id)! + 0.5) * (100 / (maxLevel + 1)) * 4 + 50;
            const y1 = levels.get(from.id)! * 100 + 50;
            const x2 = (levels.get(to.id)! + 0.5) * (100 / (maxLevel + 1)) * 4 + 50;
            const y2 = levels.get(to.id)! * 100 + 50;
            return <line key={`${from.id}-${to.id}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth={1.5} className="text-border" markerEnd="url(#arrow)" />;
          }))}
          {/* Arrow marker */}
          <defs><marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="currentColor" className="text-muted-foreground" /></marker></defs>
          {/* Nodes */}
          {tasks.map((t) => {
            const level = levels.get(t.id)!;
            const x = (level + 0.5) * (100 / (maxLevel + 1)) * 4 + 50;
            const y = level * 100 + 50;
            const isSelected = t.id === selected;
            return (
              <g key={t.id} className="cursor-pointer" onClick={() => setSelected(t.id)}>
                <rect x={x - 70} y={y - 18} width={140} height={36} rx={6}
                  fill={isSelected ? "rgb(16 185 129 / 0.15)" : "rgb(255 255 255)"}
                  stroke={isSelected ? "rgb(16 185 129)" : "rgb(212 212 216)"}
                  strokeWidth={isSelected ? 2 : 1}
                  className="dark:fill-muted/30 dark:stroke-border" />
                <text x={x} y={y - 2} textAnchor="middle" className="fill-foreground" style={{ fontSize: "9px", fontWeight: 600 }}>
                  {t.title.length > 18 ? t.title.slice(0, 16) + "…" : t.title}
                </text>
                <text x={x} y={y + 10} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: "8px" }}>
                  {t.status} · {t.priority}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      {selectedTask && (
        <div className="w-64 shrink-0 border-l border-border bg-muted/10 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Task Detail</h4>
          <p className="text-sm font-medium text-foreground">{selectedTask.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{selectedTask.description}</p>
          <Separator className="my-2" />
          <div className="space-y-1 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><TaskStatusBadge status={selectedTask.status} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><PriorityBadge priority={selectedTask.priority} /></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Complexity</span><span className="text-foreground">{selectedTask.complexity}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Est. duration</span><span className="text-foreground">{formatDuration(selectedTask.estimatedDurationMs)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Agent</span><span className="font-mono text-foreground">{selectedTask.assignedAgentId?.replace("agent.", "") ?? "—"}</span></div>
          </div>
          {selectedTask.requiredTools.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Required Tools</p>
              <div className="flex flex-wrap gap-1">
                {selectedTask.requiredTools.map((t) => <Badge key={t} variant="outline" className="text-[9px] font-mono">{t}</Badge>)}
              </div>
            </>
          )}
          {selectedTask.dependsOn.length > 0 && (
            <>
              <Separator className="my-2" />
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Depends On</p>
              <div className="space-y-0.5">
                {selectedTask.dependsOn.map((id) => {
                  const dep = plan.tasks.find((t) => t.id === id);
                  return <div key={id} className="text-[10px] text-muted-foreground">{dep?.title ?? id}</div>;
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Workflow Explorer ──────────────────────────────────────────────────

function WorkflowExplorer() {
  const { workflows, hydrate, loading } = useWorkflowStore();
  const [selected, setSelected] = React.useState<Workflow | null>(null);

  React.useEffect(() => { if (workflows.length === 0) hydrate(); }, [workflows.length, hydrate]);

  if (loading && workflows.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading workflows…</div>;
  }

  return (
    <div className="flex h-full">
      <div className="w-64 shrink-0 border-r border-border bg-muted/10 p-2 ff-scroll overflow-y-auto">
        <div className="space-y-1">
          {workflows.map((w) => (
            <button key={w.id} onClick={() => setSelected(w)}
              className={cn("flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors",
                selected?.id === w.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40")}>
              <span className="text-lg">{w.icon}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-foreground">{w.name}</div>
                <div className="truncate text-[10px] text-muted-foreground">{w.steps.length} steps</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <div className="ff-scroll h-full overflow-y-auto p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">{selected.description}</p>
              </div>
              <Badge variant="outline" className="ml-auto text-[9px]">{selected.steps.length} steps</Badge>
            </div>
            <div className="space-y-2">
              {selected.steps.map((step, i) => (
                <div key={step.id} className="rounded-lg border border-border/60 bg-card p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{i + 1}</span>
                    <span className="text-sm font-medium text-foreground">{step.title}</span>
                    <Badge variant="outline" className="ml-auto text-[9px] font-mono">{step.agentId.replace("agent.", "")}</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{step.description}</p>
                  {step.requiredTools.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {step.requiredTools.map((t) => <Badge key={t} variant="outline" className="text-[9px] font-mono">{t}</Badge>)}
                    </div>
                  )}
                  {step.dependsOn.length > 0 && (
                    <p className="mt-1 text-[9px] text-muted-foreground">Depends on: {step.dependsOn.map((d) => d.split(".").pop()).join(", ")}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : <EmptyState icon={GitBranch} title="Select a workflow" description="Inspect steps, agents, and dependencies." />}
      </div>
    </div>
  );
}

// ─── Agent Registry ─────────────────────────────────────────────────────

function AgentRegistry() {
  const { agents, hydrate, query, setQuery, categoryFilter, setCategoryFilter, filtered, loading } = useAgentStore();
  const [selected, setSelected] = React.useState<AgentDescriptor | null>(null);

  React.useEffect(() => { if (agents.length === 0) hydrate(); }, [agents.length, hydrate]);
  const categories = ["all", "planning", "flutter", "ui", "state", "backend", "api", "database", "testing", "debug", "review", "security", "performance", "docs", "i18n", "git", "deployment"];

  return (
    <div className="flex h-full">
      <div className="flex w-1/2 min-w-[300px] flex-col border-r border-border">
        <div className="border-b border-border p-3 space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agents…" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1 ff-scroll max-h-16 overflow-y-auto">
            {categories.map((c) => (
              <button key={c} onClick={() => setCategoryFilter(c as any)}
                className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium capitalize transition-colors",
                  categoryFilter === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>{c}</button>
            ))}
          </div>
        </div>
        <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-2">
          {loading && agents.length === 0 ? <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div> : (
            <div className="space-y-1">
              {filtered().map((a) => (
                <button key={a.id} onClick={() => setSelected(a)}
                  className={cn("flex w-full items-center gap-2 rounded-md border p-2 text-left transition-colors",
                    selected?.id === a.id ? "border-primary bg-primary/5" : "border-border/60 hover:border-primary/40")}>
                  <span className="text-lg">{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{a.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{a.id}</div>
                  </div>
                  <AgentStatusBadge status={a.status} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        {selected ? (
          <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.icon}</span>
              <div>
                <h3 className="text-base font-semibold text-foreground">{selected.name}</h3>
                <p className="text-xs text-muted-foreground">{selected.id} · v{selected.version}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <AgentStatusBadge status={selected.status} />
                <Badge variant="outline" className="text-[9px] capitalize">{selected.category}</Badge>
                {!selected.implemented && <Badge variant="outline" className="text-[9px] text-amber-600">placeholder</Badge>}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{selected.description}</p>
            <Card><CardContent className="p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Capabilities</h4>
              <div className="flex flex-wrap gap-1">
                {selected.capabilities.map((c) => <Badge key={c} variant="secondary" className="text-[9px]">{c}</Badge>)}
              </div>
            </CardContent></Card>
            <Card><CardContent className="p-4">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Allowed Tools ({selected.allowedTools.length})</h4>
              {selected.allowedTools.length === 0 ? <p className="text-xs text-muted-foreground">None</p> : (
                <div className="space-y-0.5">{selected.allowedTools.map((t) => <div key={t} className="font-mono text-xs text-foreground">{t}</div>)}</div>
              )}
            </CardContent></Card>
          </div>
        ) : <EmptyState icon={Boxes} title="Select an agent" description="Inspect capabilities, allowed tools, and status." />}
      </div>
    </div>
  );
}

// ─── Thinking Panel ─────────────────────────────────────────────────────

function ThinkingPanel() {
  const { session } = usePlannerStore();
  const steps = session?.thinkingSteps ?? [];

  if (steps.length === 0) {
    return <EmptyState icon={Sparkles} title="No thinking steps" description="Generate a plan to see the reasoning timeline." />;
  }

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-2">
      <h3 className="mb-2 text-sm font-semibold text-foreground">Reasoning Timeline</h3>
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-card p-3">
          <div className="flex flex-col items-center">
            <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold",
              step.status === "completed" ? "bg-emerald-500/15 text-emerald-600" :
              step.status === "active" ? "bg-sky-500/15 text-sky-600" :
              "bg-muted text-muted-foreground")}>
              {step.status === "completed" ? "✓" : step.status === "active" ? "●" : i + 1}
            </div>
            {i < steps.length - 1 && <div className="mt-1 h-6 w-px bg-border" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{step.title}</span>
              <Badge variant="outline" className="text-[9px] capitalize">{step.phase}</Badge>
              {step.status === "active" && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{step.description}</p>
            {step.output && <p className="mt-1 text-[10px] text-muted-foreground">{step.output}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Timeline Viewer ────────────────────────────────────────────────────

function TimelineViewer() {
  const { events, hydrate, loading, typeFilter, setTypeFilter, filtered } = useTimelineStore();

  React.useEffect(() => { hydrate(); }, [hydrate]);
  const types = ["all", "intent-detected", "goal-created", "plan-created", "task-started", "task-completed", "task-failed", "agent-assigned"];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-3 overflow-x-auto ff-scroll">
        {types.map((t) => (
          <button key={t} onClick={() => setTypeFilter(t as any)}
            className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors capitalize",
              typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{t.replace(/-/g, " ")}</button>
        ))}
        <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={hydrate}><RefreshCw className="mr-1 h-3 w-3" />Refresh</Button>
      </div>
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {loading ? <div className="flex items-center justify-center py-8 text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading…</div> :
         filtered().length === 0 ? <EmptyState icon={Clock} title="No events" description="Timeline events will appear here as plans are created and executed." /> : (
          <div className="space-y-1.5">
            {filtered().map((e: TimelineEvent) => (
              <div key={e.id} className="flex items-start gap-2 rounded-md border border-border/60 bg-card p-2.5 text-xs">
                <Badge variant="outline" className="text-[9px] shrink-0">{e.type}</Badge>
                <span className="font-medium text-foreground">{e.title}</span>
                {e.agentId && <Badge variant="outline" className="text-[9px] font-mono">{e.agentId.replace("agent.", "")}</Badge>}
                <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{new Date(e.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Metrics Dashboard ──────────────────────────────────────────────────

function MetricsDashboard() {
  const { metrics, hydrate, loading } = usePlannerMetricsStore();
  React.useEffect(() => { hydrate(); }, [hydrate]);

  if (loading && !metrics) return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading metrics…</div>;
  if (!metrics) return <EmptyState icon={BarChart3} title="No metrics yet" description="Create and execute plans to see metrics." />;

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Total Sessions" value={metrics.totalSessions} />
        <Metric label="Total Plans" value={metrics.totalPlans} />
        <Metric label="Avg Task Count" value={metrics.averageTaskCount} />
        <Metric label="Planning Time" value={formatDuration(metrics.averagePlanningTimeMs)} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric label="Execution Success" value={`${(metrics.executionSuccessRate * 100).toFixed(0)}%`} />
        <Metric label="Workflow Success" value={`${(metrics.workflowSuccessRate * 100).toFixed(0)}%`} />
        <Metric label="Planning Accuracy" value={`${(metrics.planningAccuracy * 100).toFixed(0)}%`} />
        <Metric label="Retry Count" value={metrics.retryCount} />
      </div>
      <Card>
        <CardContent className="p-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Agent Utilization</h4>
          {metrics.agentUtilization.filter((a) => a.taskCount > 0).length === 0 ? (
            <p className="text-xs text-muted-foreground">No agent usage yet.</p>
          ) : (
            <div className="space-y-1.5">
              {metrics.agentUtilization.filter((a) => a.taskCount > 0).sort((a, b) => b.taskCount - a.taskCount).map((a) => (
                <div key={a.agentId} className="flex items-center gap-2 text-xs">
                  <span className="w-32 truncate font-mono text-foreground">{a.agentId.replace("agent.", "")}</span>
                  <div className="h-4 flex-1 overflow-hidden rounded bg-muted">
                    <div className="h-full rounded bg-primary" style={{ width: `${a.utilization * 100}%` }} />
                  </div>
                  <span className="w-8 text-right font-mono text-foreground">{a.taskCount}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
