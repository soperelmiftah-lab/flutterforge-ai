"use client";

import * as React from "react";
import Link from "next/link";
import {
  Plus,
  Rocket,
  FileCode2,
  GitBranch,
  Clock,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Activity as ActivityIcon,
  LayoutTemplate,
  CheckCircle2,
  Loader2,
  Circle,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ProjectCard } from "@/components/common/project-card";
import { CreateProjectDialog } from "@/components/common/create-project-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { templates } from "@/config/templates";
import { roadmap } from "@/config/roadmap";
import { useProjectStore, useWorkspaceStore } from "@/stores";
import { timeAgo } from "@/lib/utils";

export default function DashboardPage() {
  const projects = useProjectStore((s) => s.projects);
  const activity = useWorkspaceStore((s) => s.activity);
  const [createOpen, setCreateOpen] = React.useState(false);

  const recent = [...projects]
    .sort((a, b) => +new Date(b.lastOpenedAt) - +new Date(a.lastOpenedAt))
    .slice(0, 4);
  const favorites = projects.filter((p) => p.favorite).length;
  const activeCount = projects.filter((p) => p.status === "active").length;

  const stats = [
    {
      label: "Total projects",
      value: projects.length,
      icon: Rocket,
      hint: `${activeCount} active`,
    },
    {
      label: "Favorite",
      value: favorites,
      icon: TrendingUp,
      hint: "Pinned to top",
    },
    {
      label: "Files edited",
      value: 128,
      icon: FileCode2,
      hint: "This week",
    },
    {
      label: "Build time",
      value: "2.4m",
      icon: Clock,
      hint: "Avg per build",
    },
  ];

  const quickStart = [
    { label: "Open Workspace", href: "/workspace", icon: FileCode2 },
    { label: "Browse Templates", href: "/templates", icon: LayoutTemplate },
    { label: "View History", href: "/history", icon: Clock },
    { label: "Configure Settings", href: "/settings", icon: Sparkles },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        description="Your FlutterForge workspace at a glance."
        icon={Rocket}
        badge="Phase 1"
        actions={
          <CreateProjectDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            trigger={
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> New project
              </Button>
            }
          />
        }
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="overflow-hidden">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-xl font-semibold tracking-tight text-foreground">
                    {s.value}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {s.label} · {s.hint}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick start */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Quick start</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickStart.map((q) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.label}
                href={q.href}
                className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 transition-all hover:border-primary/40 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-foreground">{q.label}</span>
                <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent projects */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Recent projects</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/projects">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
          {recent.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No projects yet"
              description="Create your first Flutter project to get started."
              action={
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="mr-1.5 h-4 w-4" /> New project
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recent.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>

        {/* Activity */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
          <Card>
            <CardContent className="p-0">
              <ul className="ff-scroll max-h-[420px] divide-y divide-border/60 overflow-y-auto">
                {activity.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-start gap-3 p-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <ActivityIcon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{a.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.projectName} · {timeAgo(a.timestamp)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Templates preview */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Popular templates</h2>
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/templates">
              Browse all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {templates.slice(0, 3).map((t) => (
            <div
              key={t.id}
              className={`relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br ${t.accent} p-4`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background/80 text-xl">
                  {t.icon}
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {t.description}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">{t.category}</Badge>
                <span className="text-[11px] text-muted-foreground">{t.framework}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap progress */}
      <div className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Roadmap progress</h2>
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {roadmap.map((phase) => {
                const Icon =
                  phase.status === "done"
                    ? CheckCircle2
                    : phase.status === "active"
                      ? Loader2
                      : Circle;
                return (
                  <div key={phase.phase} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={`h-4 w-4 ${
                          phase.status === "active"
                            ? "animate-spin text-primary"
                            : phase.status === "done"
                              ? "text-emerald-500"
                              : "text-muted-foreground"
                        }`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {phase.phase}
                      </span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{phase.eta}</Badge>
                    </div>
                    <span className="text-sm font-medium text-foreground">{phase.title}</span>
                  </div>
                );
              })}
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              Phase 1 ships the foundation. AI agent, live preview, and build engine
              arrive in subsequent phases — all on this same architecture.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="h-4" />
      <div className="hidden">
        <GitBranch />
      </div>
    </PageContainer>
  );
}
