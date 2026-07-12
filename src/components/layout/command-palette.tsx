"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Code2,
  FolderKanban,
  LayoutTemplate,
  History,
  Settings,
  FileCode2,
  Search,
  Rocket,
} from "lucide-react";
import { appNavItems } from "@/config/navigation";
import { templates } from "@/config/templates";
import { useUIStore, useProjectStore, useEditorStore } from "@/stores";

/**
 * Global command palette (Cmd/Ctrl+K). Quick navigation, project switching,
 * and template access. Wired to the UI store so any component can open it.
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const projects = useProjectStore((s) => s.projects);
  const tree = useEditorStore((s) => s.tree);

  // Flatten files for quick open
  const files = React.useMemo(() => {
    const out: { name: string; path: string; id: string }[] = [];
    const walk = (nodes: typeof tree) => {
      for (const n of nodes) {
        if (n.type === "file") out.push({ name: n.name, path: n.path, id: n.id });
        if (n.children) walk(n.children);
      }
    };
    walk(tree);
    return out;
  }, [tree]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, files, commands…" />
      <CommandList className="ff-scroll">
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigate">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem key={item.href} value={`${item.title} ${item.description}`} onSelect={() => go(item.href)}>
                <Icon className="mr-2 h-4 w-4" />
                {item.title}
              </CommandItem>
            );
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Projects">
          {projects.slice(0, 6).map((p) => (
            <CommandItem
              key={p.id}
              value={`project ${p.name} ${p.description}`}
              onSelect={() => go("/workspace")}
            >
              <Rocket className="mr-2 h-4 w-4" />
              {p.name}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Quick open">
          {files.slice(0, 8).map((f) => (
            <CommandItem
              key={f.id}
              value={`file ${f.name} ${f.path}`}
              onSelect={() => go("/workspace")}
            >
              <FileCode2 className="mr-2 h-4 w-4" />
              {f.name}
              <span className="ml-2 text-xs text-muted-foreground">{f.path}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Templates">
          {templates.slice(0, 4).map((t) => (
            <CommandItem
              key={t.id}
              value={`template ${t.name} ${t.description}`}
              onSelect={() => go("/templates")}
            >
              <LayoutTemplate className="mr-2 h-4 w-4" />
              {t.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

// Re-export to satisfy lint for unused symbol intent
export { Search };
