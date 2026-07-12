"use client";

import * as React from "react";
import {
  History as HistoryIcon,
  FileCode2,
  Rocket,
  GitBranch,
  Trash2,
  Play,
  Share2,
  Plus,
  MessageSquare,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/common/empty-state";
import { useWorkspaceStore } from "@/stores";
import { timeAgo } from "@/lib/utils";
import type { ActivityEvent } from "@/lib/types";

const iconForType: Record<ActivityEvent["type"], React.ElementType> = {
  created: Plus,
  edited: FileCode2,
  built: Rocket,
  shared: Share2,
  deleted: Trash2,
  previewed: Play,
};

const labelForType: Record<ActivityEvent["type"], string> = {
  created: "Created",
  edited: "Edited",
  built: "Built",
  shared: "Shared",
  deleted: "Deleted",
  previewed: "Previewed",
};

export default function HistoryPage() {
  const { activity, chatSessions, clearActivity } = useWorkspaceStore();
  const [filter, setFilter] = React.useState<"all" | ActivityEvent["type"]>("all");

  const filtered =
    filter === "all" ? activity : activity.filter((a) => a.type === filter);

  const filterOptions: ("all" | ActivityEvent["type"])[] = [
    "all",
    "edited",
    "created",
    "built",
    "previewed",
    "shared",
  ];

  return (
    <PageContainer>
      <PageHeader
        title="History"
        description="Your recent activity and AI chat sessions."
        icon={HistoryIcon}
        actions={
          activity.length > 0 ? (
            <Button variant="outline" size="sm" onClick={clearActivity}>
              <Trash2 className="mr-1.5 h-4 w-4" /> Clear
            </Button>
          ) : undefined
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Activity timeline */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center gap-1 overflow-x-auto pb-1 ff-scroll">
            {filterOptions.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`inline-flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                }`}
              >
                {f === "all" ? "All activity" : labelForType[f as ActivityEvent["type"]]}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="No activity yet"
              description="Your edits, builds, and previews will show up here."
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <ol className="ff-scroll max-h-[640px] divide-y divide-border/60 overflow-y-auto">
                  {filtered.map((a) => {
                    const Icon = iconForType[a.type];
                    return (
                      <li key={a.id} className="flex items-start gap-3 p-4">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              {a.message}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {labelForType[a.type]}
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {a.projectName ?? "—"} · {timeAgo(a.timestamp)}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat sessions */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">AI chat sessions</h2>
            <Badge variant="outline" className="text-[10px]">Phase 2</Badge>
          </div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-primary" /> Recent conversations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border/60">
                {chatSessions.map((s) => (
                  <li key={s.id} className="p-3 transition-colors hover:bg-muted/40">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {s.messageCount} messages · {timeAgo(s.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="mt-3">
            <EmptyState
              icon={GitBranch}
              title="Sessions are saved locally"
              description="AI chat history persists in your browser until cloud sync arrives."
              className="py-6"
            />
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
