"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Star, LayoutGrid, List, Filter } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ProjectCard } from "@/components/common/project-card";
import { CreateProjectDialog } from "@/components/common/create-project-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FolderKanban } from "lucide-react";
import { useProjectStore } from "@/stores";
import type { ProjectStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const filters: { label: string; value: ProjectStatus | "all" | "favorites" }[] = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Drafts", value: "draft" },
  { label: "Building", value: "building" },
  { label: "Archived", value: "archived" },
  { label: "Favorites", value: "favorites" },
];

export default function ProjectsPage() {
  const router = useRouter();
  const projects = useProjectStore((s) => s.projects);
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<(typeof filters)[number]["value"]>("all");
  const [createOpen, setCreateOpen] = React.useState(false);

  // Open the create dialog if navigated with ?new=1
  React.useEffect(() => {
    if (typeof window !== "undefined" && window.location.search.includes("new=1")) {
      setCreateOpen(true);
      router.replace("/projects");
    }
  }, [router]);

  const filtered = projects.filter((p) => {
    if (filter === "favorites" && !p.favorite) return false;
    if (filter !== "all" && filter !== "favorites" && p.status !== filter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.framework.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <PageContainer>
      <PageHeader
        title="Projects"
        description="Manage all your Flutter projects in one place."
        icon={FolderKanban}
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

      {/* Controls */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 ff-scroll">
          <Filter className="mr-1 h-4 w-4 shrink-0 text-muted-foreground" />
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center gap-1 rounded-md px-3 text-xs font-medium transition-colors",
                filter === f.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {f.value === "favorites" && <Star className="h-3 w-3" />}
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {filtered.length} project{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="hidden items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={FolderKanban}
            title="No projects found"
            description="Try adjusting your search or filters, or create a new project."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> New project
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <Badge variant="outline" className="text-[10px]">
          Phase 1 · Mock data
        </Badge>
      </div>
    </PageContainer>
  );
}
