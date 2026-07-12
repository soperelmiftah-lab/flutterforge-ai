"use client";

import * as React from "react";
import {
  Package,
  Boxes,
  FunctionSquare,
  Route,
  Image as ImageIcon,
  TestTube,
  Layers,
  Activity,
  Coins,
  Hash,
  Cpu,
  Smartphone,
  Clock,
  Zap,
} from "lucide-react";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { useDependencyStore } from "@/stores/dependency-store";
import { useAIStore } from "@/stores/ai-store";
import { Metric, Section, InfoRow, TabLoading } from "./shared";
import { Badge } from "@/components/ui/badge";
import { formatTokens } from "@/features/ai/tokens/counter";

export function OverviewTab() {
  const { knowledgeBase, statistics, loading, lastIndexedAt, files } = useWorkspaceIndexStore();
  const { edges } = useDependencyStore();
  const ai = useAIStore();

  if (loading && !knowledgeBase) return <TabLoading label="Building project index…" />;
  if (!knowledgeBase) return <div className="p-4 text-sm text-muted-foreground">No index available.</div>;

  const kb = knowledgeBase;
  const stats = statistics;
  const platforms = Object.entries(kb.platforms).filter(([, v]) => v).map(([k]) => k);
  const symbolsByKind = stats?.symbolsByKind ?? {};
  const widgetCount = symbolsByKind.widget ?? 0;
  const classCount = symbolsByKind.class ?? 0;
  const fnCount = symbolsByKind.function + symbolsByKind.method ?? 0;
  const providerCount = symbolsByKind.provider ?? 0;
  const routeCount = symbolsByKind.route ?? 0;
  const testCount = files.filter((f) => f.path.startsWith("test/")).length;
  const flutterVersion = kb.pubspec?.environment?.flutter ?? "any";
  const dartSdk = kb.pubspec?.environment?.sdk ?? "any";

  return (
    <div className="ff-scroll h-full overflow-y-auto p-4">
      {/* Project header */}
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
          📦
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-foreground">{kb.name}</h2>
          <p className="text-xs text-muted-foreground">
            {kb.kind} · {kb.pubspec?.version ?? "0.0.0"} ·{" "}
            {kb.pubspec?.description?.slice(0, 60) ?? "No description"}
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Activity className="h-3 w-3 text-emerald-500" />
          Indexed
        </Badge>
      </div>

      {/* Core metrics */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Metric label="Files" value={kb.fileCount} icon={Layers} />
        <Metric label="Symbols" value={kb.symbolCount} icon={Boxes} />
        <Metric label="Lines" value={kb.totalLines.toLocaleString()} icon={Hash} />
        <Metric label="Tokens" value={formatTokens(kb.totalTokens)} icon={Coins} />
        <Metric label="Packages" value={kb.dependencies.length} icon={Package} sub={`${kb.devDependencies.length} dev`} />
        <Metric label="Edges" value={edges.length} icon={Zap} sub="dependency graph" />
      </div>

      {/* Symbol breakdown */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <Metric label="Widgets" value={widgetCount} icon={Boxes} />
        <Metric label="Classes" value={classCount} icon={Layers} />
        <Metric label="Functions" value={fnCount} icon={FunctionSquare} />
        <Metric label="Providers" value={providerCount} icon={Zap} />
        <Metric label="Routes" value={routeCount} icon={Route} />
        <Metric label="Tests" value={testCount} icon={TestTube} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Environment */}
        <Section title="Environment" icon={Cpu}>
          <InfoRow label="Project type" value={<span className="capitalize">{kb.kind}</span>} />
          <InfoRow label="Flutter" value={flutterVersion} />
          <InfoRow label="Dart SDK" value={dartSdk} />
          <InfoRow label="State management" value={<span className="capitalize">{kb.stateManagement}</span>} capitalize />
          <InfoRow label="Routing" value={<span className="capitalize">{kb.routing}</span>} capitalize />
          <InfoRow label="Assets" value={kb.assets.length} />
        </Section>

        {/* Platform support */}
        <Section title="Platform Support" icon={Smartphone}>
          <div className="grid grid-cols-3 gap-2">
            {(["android", "ios", "web", "windows", "linux", "macos"] as const).map((p) => {
              const supported = kb.platforms[p];
              return (
                <div
                  key={p}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center ${
                    supported
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-border/60 bg-muted/20 opacity-50"
                  }`}
                >
                  <PlatformIcon platform={p} />
                  <span className="text-[10px] font-medium capitalize text-foreground">{p}</span>
                  {supported && <Badge variant="outline" className="text-[8px] text-emerald-600">on</Badge>}
                </div>
              );
            })}
          </div>
        </Section>

        {/* Index status */}
        <Section title="Index Status" icon={Activity}>
          <InfoRow
            label="Last indexed"
            value={lastIndexedAt ? new Date(lastIndexedAt).toLocaleString() : "never"}
          />
          <InfoRow label="Index size" value={`${formatTokens(kb.totalTokens)} tokens`} />
          <InfoRow label="Avg file size" value={`${stats?.averageSize ?? 0} lines`} />
          <InfoRow label="Dependencies" value={kb.dependencies.length} />
          <InfoRow label="Dev dependencies" value={kb.devDependencies.length} />
        </Section>

        {/* AI context */}
        <Section title="AI Context" icon={Cpu}>
          <InfoRow label="Provider" value={<span className="capitalize">{ai.provider}</span>} />
          <InfoRow label="Model" value={ai.model || "not selected"} />
          <InfoRow label="Streaming" value={ai.streaming ? "on" : "off"} />
          <InfoRow label="Temperature" value={ai.temperature} />
          <InfoRow label="Context length" value={formatTokens(ai.contextLength)} />
          <InfoRow
            label="Usage"
            value={`${formatTokens(kb.totalTokens)} / ${formatTokens(ai.contextLength)} (${((kb.totalTokens / ai.contextLength) * 100).toFixed(1)}%)`}
          />
        </Section>
      </div>

      {/* Top dependencies */}
      <div className="mt-4">
        <Section title="Dependencies" icon={Package} action={<Badge variant="outline">{kb.dependencies.length}</Badge>}>
          <div className="ff-scroll max-h-40 space-y-0.5 overflow-y-auto">
            {kb.dependencies.map((d) => (
              <div key={d} className="flex items-center gap-2 rounded px-1.5 py-0.5 text-xs hover:bg-muted/40">
                <Hash className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="font-mono text-foreground">{d}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const icons: Record<string, string> = {
    android: "🤖",
    ios: "🍎",
    web: "🌐",
    windows: "🪟",
    linux: "🐧",
    macos: "💻",
  };
  return <span className="text-xl">{icons[platform] ?? "📦"}</span>;
}
