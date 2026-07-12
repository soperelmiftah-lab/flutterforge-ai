"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, LayoutTemplate, ArrowRight, Check } from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { templates, type Template } from "@/config/templates";
import { useProjectStore, useWorkspaceStore } from "@/stores";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const categories = ["All", "Mobile", "Web", "Desktop", "Fullstack", "AI"] as const;

export default function TemplatesPage() {
  const router = useRouter();
  const create = useProjectStore((s) => s.create);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<(typeof categories)[number]>("All");
  const [selected, setSelected] = React.useState<string | null>(null);

  const filtered = templates.filter((t) => {
    if (category !== "All" && t.category !== category) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.includes(q))
      );
    }
    return true;
  });

  const createFromTemplate = (t: Template) => {
    const project = create({
      name: t.name,
      description: t.description,
      framework: t.framework,
      template: t.id,
    });
    setActiveProject(project.id);
    toast.success(`Created project from “${t.name}”`);
    router.push("/workspace");
  };

  return (
    <PageContainer>
      <PageHeader
        title="Templates"
        description="Start fast with curated Flutter blueprints."
        icon={LayoutTemplate}
      />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search templates…"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-1 ff-scroll">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "inline-flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium transition-colors",
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => {
          const isSel = selected === t.id;
          return (
            <Card
              key={t.id}
              className={cn(
                "group relative cursor-pointer overflow-hidden transition-all hover:border-primary/40 hover:shadow-md",
                isSel && "border-primary ring-1 ring-primary/30"
              )}
              onClick={() => setSelected(isSel ? null : t.id)}
            >
              <div className={cn("h-24 bg-gradient-to-br", t.accent)}>
                <div className="flex h-full items-center justify-center text-4xl">
                  {t.icon}
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-foreground">{t.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t.framework}</p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {t.category}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                  {t.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {t.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      createFromTemplate(t);
                    }}
                  >
                    Use template <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  {isSel && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
