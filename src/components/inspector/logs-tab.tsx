"use client";

import * as React from "react";
import {
  Activity,
  Search,
  FileCode2,
  Network,
  Eye,
  Bot,
  Wrench,
  Eraser,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "./shared";
import { cn } from "@/lib/utils";

/** Log entry types. */
type LogType = "index" | "search" | "context" | "watcher" | "ai" | "tool";

interface LogEntry {
  id: string;
  type: LogType;
  message: string;
  timestamp: string;
  details?: string;
}

const logTypeMeta: Record<LogType, { label: string; icon: React.ElementType; color: string }> = {
  index: { label: "Index", icon: FileCode2, color: "text-primary" },
  search: { label: "Search", icon: Search, color: "text-amber-500" },
  context: { label: "Context", icon: Network, color: "text-cyan-500" },
  watcher: { label: "Watcher", icon: Eye, color: "text-violet-500" },
  ai: { label: "AI", icon: Bot, color: "text-emerald-500" },
  tool: { label: "Tool", icon: Wrench, color: "text-rose-500" },
};

const LOG_KEY = "flutterforge-ws-logs";

function loadLogs(): LogEntry[] {
  if (typeof window === "undefined") return seedLogs();
  try {
    const raw = sessionStorage.getItem(LOG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  const seeded = seedLogs();
  try {
    sessionStorage.setItem(LOG_KEY, JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

function seedLogs(): LogEntry[] {
  const now = Date.now();
  return [
    { id: "1", type: "index", message: "Project scan completed", timestamp: new Date(now - 1000 * 60 * 2).toISOString(), details: "7 files, 9 symbols indexed" },
    { id: "2", type: "index", message: "Dependency graph built", timestamp: new Date(now - 1000 * 60 * 2).toISOString(), details: "0 edges (mock project)" },
    { id: "3", type: "search", message: 'Search "HomeScreen"', timestamp: new Date(now - 1000 * 60).toISOString(), details: "2 results" },
    { id: "4", type: "context", message: "Context assembled for query", timestamp: new Date(now - 1000 * 30).toISOString(), details: "2 files, 103 tokens" },
    { id: "5", type: "watcher", message: "Watcher started (in-memory)", timestamp: new Date(now - 1000 * 60 * 5).toISOString() },
  ];
}

export function LogsTab() {
  const [logs, setLogs] = React.useState<LogEntry[]>(loadLogs);
  const [filter, setFilter] = React.useState<LogType | "all">("all");

  const filtered = filter === "all" ? logs : logs.filter((l) => l.type === filter);

  const clear = () => {
    setLogs([]);
    try {
      sessionStorage.removeItem(LOG_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Filter bar */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-3">
        <Activity className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
        <button
          onClick={() => setFilter("all")}
          className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors", filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
        >
          All ({logs.length})
        </button>
        {(Object.keys(logTypeMeta) as LogType[]).map((t) => {
          const count = logs.filter((l) => l.type === t).length;
          return (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn("rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors", filter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {logTypeMeta[t].label} ({count})
            </button>
          );
        })}
        <Button variant="ghost" size="sm" className="ml-auto h-6 text-[10px]" onClick={clear}>
          <Eraser className="mr-1 h-3 w-3" /> Clear
        </Button>
      </div>

      {/* Logs */}
      <div className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">No log entries</p>
          </div>
        ) : (
          <div className="space-y-1">
            {[...filtered].reverse().map((log) => {
              const meta = logTypeMeta[log.type];
              const Icon = meta.icon;
              return (
                <div key={log.id} className="flex items-start gap-2 rounded-md border border-border/60 bg-card p-2.5">
                  <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", meta.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[9px]">{meta.label}</Badge>
                      <span className="text-xs font-medium text-foreground">{log.message}</span>
                    </div>
                    {log.details && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{log.details}</p>
                    )}
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
