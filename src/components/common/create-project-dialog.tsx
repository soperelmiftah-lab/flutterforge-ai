"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { templates } from "@/config/templates";
import { useProjectStore, useWorkspaceStore } from "@/stores";

const schema = z.object({
  name: z.string().min(2, "Project name is required").max(60),
  description: z.string().max(200).optional().default(""),
  framework: z.string().min(1, "Select a framework"),
  template: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateProjectDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * CreateProjectDialog — shared project creation flow. Used by the dashboard,
 * projects page, and sidebar "New project" action. On submit it creates the
 * project in the store and routes to the workspace.
 */
export function CreateProjectDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const create = useProjectStore((s) => s.create);
  const setActiveProject = useWorkspaceStore((s) => s.setActiveProject);
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", framework: "Flutter 3.22", template: "tpl-counter" },
  });

  const selectedTemplate = watch("template");

  const onSubmit = (values: FormValues) => {
    const project = create({
      name: values.name,
      description: values.description || "A new Flutter project.",
      framework: values.framework,
      template: values.template,
    });
    setActiveProject(project.id);
    toast.success(`Project “${project.name}” created`);
    reset();
    setOpen(false);
    router.push("/workspace");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" /> Create a new project
          </DialogTitle>
          <DialogDescription>
            Spin up a fresh Flutter workspace. You can change everything later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Project name</Label>
            <Input
              id="name"
              placeholder="My Flutter App"
              autoFocus
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="What will this app do?"
              rows={2}
              {...register("description")}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Framework</Label>
              <Select
                defaultValue="Flutter 3.22"
                onValueChange={(v) => setValue("framework", v, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Flutter 3.22">Flutter 3.22</SelectItem>
                  <SelectItem value="Flutter 3.19">Flutter 3.19</SelectItem>
                  <SelectItem value="Flutter Web">Flutter Web</SelectItem>
                </SelectContent>
              </Select>
              {errors.framework && (
                <p className="text-xs text-destructive">{errors.framework.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Template</Label>
              <Select
                defaultValue="tpl-counter"
                onValueChange={(v) => setValue("template", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon} {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTemplate && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              {templates.find((t) => t.id === selectedTemplate)?.description}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
