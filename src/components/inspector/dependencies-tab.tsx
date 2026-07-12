"use client";

import * as React from "react";
import { Network, ZoomIn, ZoomOut, Maximize, Loader2 } from "lucide-react";
import { useDependencyStore } from "@/stores/dependency-store";
import { useWorkspaceIndexStore } from "@/stores/workspace-index-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DependencyEdge, WorkspacePath } from "@/features/workspace-intelligence/types";

const graphKinds = [
  { id: "file", label: "File Graph", desc: "File → file imports" },
  { id: "widget", label: "Widget Graph", desc: "Widget hierarchy" },
  { id: "provider", label: "Provider Graph", desc: "Provider → consumers" },
  { id: "service", label: "Service Graph", desc: "Services → repositories → models" },
  { id: "navigation", label: "Navigation Graph", desc: "Routes → pages" },
] as const;

type GraphKind = (typeof graphKinds)[number]["id"];

const edgeColors: Record<string, string> = {
  import: "#f59e0b",
  "widget-usage": "#8b5cf6",
  "class-reference": "#06b6d4",
  "provider-consumer": "#10b981",
  "service-usage": "#f43f5e",
  "route-target": "#0ea5e9",
  "asset-reference": "#f97316",
};

export function DependenciesTab() {
  const { edges, loading } = useDependencyStore();
  const { files } = useWorkspaceIndexStore();
  const [kind, setKind] = React.useState<GraphKind>("file");
  const [selectedPath, setSelectedPath] = React.useState<WorkspacePath | null>(null);

  // Filter edges by graph kind.
  const filteredEdges = React.useMemo(() => {
    switch (kind) {
      case "file": return edges.filter((e) => e.kind === "import");
      case "widget": return edges.filter((e) => e.kind === "widget-usage");
      case "provider": return edges.filter((e) => e.kind === "provider-consumer");
      case "service": return edges.filter((e) => e.kind === "service-usage" || e.kind === "class-reference");
      case "navigation": return edges.filter((e) => e.kind === "route-target");
      default: return edges;
    }
  }, [edges, kind]);

  // Collect nodes from filtered edges.
  const nodes = React.useMemo(() => {
    const set = new Set<WorkspacePath>();
    filteredEdges.forEach((e) => { set.add(e.from); set.add(e.to); });
    // Also include all files as nodes for the file graph.
    if (kind === "file") files.forEach((f) => set.add(f.path));
    return Array.from(set);
  }, [filteredEdges, files, kind]);

  if (loading && edges.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Building graph…</div>;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Graph kind selector */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-2">
        {graphKinds.map((g) => (
          <button
            key={g.id}
            onClick={() => { setKind(g.id); setSelectedPath(null); }}
            className={cn(
              "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
              kind === g.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            title={g.desc}
          >
            <Network className="h-3.5 w-3.5" />
            {g.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Graph canvas */}
        <div className="relative min-w-0 flex-1">
          {nodes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <Network className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-foreground">No edges for this graph type</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                The mock project has limited cross-file edges. File imports are the most populated graph.
              </p>
            </div>
          ) : (
            <GraphCanvas
              nodes={nodes}
              edges={filteredEdges}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          )}
        </div>

        {/* Detail sidebar */}
        {selectedPath && (
          <div className="w-64 shrink-0 border-l border-border bg-muted/10 p-3">
            <NodeDetail path={selectedPath} edges={edges} />
          </div>
        )}
      </div>
    </div>
  );
}

/** SVG-based graph canvas with zoom/pan and click-to-select. */
function GraphCanvas({
  nodes,
  edges,
  selectedPath,
  onSelect,
}: {
  nodes: WorkspacePath[];
  edges: DependencyEdge[];
  selectedPath: WorkspacePath | null;
  onSelect: (path: WorkspacePath) => void;
}) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const dragStart = React.useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Layout: circular arrangement of nodes.
  const positions = React.useMemo(() => {
    const cx = 250;
    const cy = 200;
    const radius = Math.min(150, 30 + nodes.length * 8);
    const map = new Map<WorkspacePath, { x: number; y: number }>();
    nodes.forEach((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      map.set(n, { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    });
    return map;
  }, [nodes]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    });
  };
  const handleMouseUp = () => setDragging(false);

  return (
    <div className="relative h-full w-full overflow-hidden bg-muted/5" style={{ cursor: dragging ? "grabbing" : "grab" }} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* Zoom controls */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1">
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))} aria-label="Zoom in">
          <ZoomIn className="h-3.5 w-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))} aria-label="Zoom out">
          <ZoomOut className="h-3.5 w-3.5" />
        </Button>
        <Button variant="secondary" size="icon" className="h-7 w-7" onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} aria-label="Reset view">
          <Maximize className="h-3.5 w-3.5" />
        </Button>
      </div>

      <svg
        className="h-full w-full"
        viewBox="0 0 500 400"
        preserveAspectRatio="xMidYMid meet"
        style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
      >
        {/* Edges */}
        {edges.map((e, i) => {
          const from = positions.get(e.from);
          const to = positions.get(e.to);
          if (!from || !to) return null;
          const color = edgeColors[e.kind] ?? "#71717a";
          const isActive = selectedPath === e.from || selectedPath === e.to;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={color}
              strokeWidth={isActive ? 2 : 1}
              strokeOpacity={isActive ? 0.9 : 0.4}
              markerEnd="url(#arrow)"
            />
          );
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#71717a" opacity="0.6" />
          </marker>
        </defs>

        {/* Nodes */}
        {nodes.map((n) => {
          const pos = positions.get(n);
          if (!pos) return null;
          const isSelected = n === selectedPath;
          const name = n.split("/").pop() ?? n;
          const r = isSelected ? 8 : 6;
          return (
            <g key={n} className="cursor-pointer" onClick={(e) => { e.stopPropagation(); onSelect(n); }}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={isSelected ? "#10b981" : "#3b82f6"}
                stroke={isSelected ? "#10b981" : "#1e293b"}
                strokeWidth={1.5}
              />
              <text
                x={pos.x}
                y={pos.y - r - 4}
                textAnchor="middle"
                className="fill-foreground"
                style={{ fontSize: "8px", fontWeight: isSelected ? 600 : 400 }}
              >
                {name.length > 18 ? name.slice(0, 16) + "…" : name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 rounded-lg border border-border bg-background/90 p-2 backdrop-blur">
        {Object.entries(edgeColors).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="h-1.5 w-4 rounded-full" style={{ backgroundColor: c }} />
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}

function NodeDetail({ path, edges }: { path: WorkspacePath; edges: DependencyEdge[] }) {
  const outgoing = edges.filter((e) => e.from === path);
  const incoming = edges.filter((e) => e.to === path);
  const name = path.split("/").pop() ?? path;

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Selected Node</div>
        <div className="break-all font-mono text-xs font-medium text-foreground">{name}</div>
        <div className="mt-0.5 break-all text-[10px] text-muted-foreground">{path}</div>
      </div>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Outgoing ({outgoing.length})
        </div>
        <div className="space-y-0.5">
          {outgoing.slice(0, 8).map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <Badge variant="outline" className="text-[8px]">{e.kind}</Badge>
              <span className="truncate font-mono text-foreground">{e.to.split("/").pop()}</span>
            </div>
          ))}
          {outgoing.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
        </div>
      </div>
      <div>
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Incoming ({incoming.length})
        </div>
        <div className="space-y-0.5">
          {incoming.slice(0, 8).map((e, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <Badge variant="outline" className="text-[8px]">{e.kind}</Badge>
              <span className="truncate font-mono text-foreground">{e.from.split("/").pop()}</span>
            </div>
          ))}
          {incoming.length === 0 && <span className="text-[10px] text-muted-foreground">None</span>}
        </div>
      </div>
    </div>
  );
}
