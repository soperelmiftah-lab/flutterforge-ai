"use client";

import * as React from "react";
import Link from "next/link";
import { Star, MoreVertical, Folder, Users, FileCode2, Pencil, Trash2, Archive } from "lucide-react";
import { cn, timeAgo, colorFromString } from "@/lib/utils";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProjectStore, useWorkspaceStore } from "@/stores";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProjectCardProps {
  project: Project;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const router = useRouter();
  const toggleFavorite = useProjectStore((s) => s.toggleFavorite);
  const remove = useProjectStore((s) => s.remove);
  const setStatus = useProjectStore((s) => s.setStatus);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const open = () => {
    setActiveProject(project.id);
    router.push("/workspace");
  };

  return (
    <>
      <div
        className={cn(
          "group relative flex flex-col rounded-xl border border-border/70 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
          className
        )}
      >
        {/* accent strip */}
        <div
          className={cn("absolute inset-x-0 top-0 h-1 rounded-t-xl", colorFromString(project.id))}
        />

        <div className="flex items-start justify-between">
          <button
            onClick={open}
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
            aria-label={`Open ${project.name}`}
          >
            <Folder className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => toggleFavorite(project.id)}
              aria-label="Toggle favorite"
            >
              <Star
                className={cn(
                  "h-4 w-4",
                  project.favorite && "fill-amber-400 text-amber-400"
                )}
              />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  aria-label="Project actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={open}>
                  <Folder className="mr-2 h-4 w-4" /> Open
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/projects")}>
                  <Pencil className="mr-2 h-4 w-4" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    setStatus(project.id, project.status === "archived" ? "active" : "archived")
                  }
                >
                  <Archive className="mr-2 h-4 w-4" />
                  {project.status === "archived" ? "Unarchive" : "Archive"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <button onClick={open} className="mt-3 text-left">
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
            {project.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {project.description}
          </p>
        </button>

        <div className="mt-3 flex items-center gap-2">
          <StatusBadge status={project.status} />
          <span className="text-[11px] text-muted-foreground">{project.framework}</span>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <FileCode2 className="h-3 w-3" /> {project.filesCount} files
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3 w-3" /> {project.collaborators}
          </span>
          <span>{timeAgo(project.lastOpenedAt)}</span>
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the project from your workspace. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                remove(project.id);
                toast.success(`Deleted “${project.name}”`);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function ProjectCardSkeleton() {
  return (
    <div className="h-44 animate-pulse rounded-xl border border-border/70 bg-card p-4">
      <div className="h-10 w-10 rounded-lg bg-muted" />
      <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
      <div className="mt-2 h-3 w-full rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
    </div>
  );
}

export { Link };
