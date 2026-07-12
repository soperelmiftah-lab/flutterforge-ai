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
  Rocket,
  Boxes,
  Bot,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Wrench,
  Zap,
  Network,
  RefreshCw,
  FilePlus,
  FileCode,
  Server,
  Database,
  Package,
  Braces,
  type LucideIcon,
} from "lucide-react";
import { appNavItems } from "@/config/navigation";
import { templates } from "@/config/templates";
import { useUIStore, useProjectStore, useEditorStore } from "@/stores";
import { useAIStore } from "@/stores/ai-store";
import { useTheme } from "next-themes";
import { toast } from "sonner";

type PaletteMode = "all" | "files" | "commands";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
  action: () => void;
  keywords?: string;
}

/**
 * Global command palette.
 *
 *   Ctrl/Cmd + K         → everything (files + commands + navigation)
 *   Ctrl/Cmd + P         → file quick-open mode
 *   Ctrl/Cmd + Shift + P → commands-only mode
 *
 * Supports: navigation, file open, project switch, templates, AI settings,
 * theme/provider/model switching, workspace reindex, and code generation
 * shortcuts (Phase 4 placeholders).
 */
export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const projects = useProjectStore((s) => s.projects);
  const tree = useEditorStore((s) => s.tree);
  const ai = useAIStore();
  const { theme, setTheme } = useTheme();
  const [mode, setMode] = React.useState<PaletteMode>("all");
  const [search, setSearch] = React.useState("");

  // Flatten files for quick open.
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

  // Close + reset on open change.
  React.useEffect(() => {
    if (!open) {
      const t = setTimeout(() => { setMode("all"); setSearch(""); }, 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Keyboard shortcuts.
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setMode("commands");
        setOpen(true);
      } else if (mod && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setMode("files");
        setOpen(true);
      } else if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMode("all");
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

  const placeholder =
    mode === "files" ? "Quick open file…" :
    mode === "commands" ? "Run command…" :
    "Search files, commands, projects…";

  // Build commands list.
  const commands: Command[] = [
    // Navigation
    ...appNavItems.map((item) => ({
      id: `nav-${item.href}`,
      label: item.title,
      hint: item.description,
      icon: item.icon,
      group: "Navigate",
      action: () => go(item.href),
      keywords: item.description,
    })),
    // Workspace
    { id: "reindex", label: "Reindex Workspace", icon: RefreshCw, group: "Workspace", action: () => { go("/inspector"); toast.success("Reindexing workspace…"); }, keywords: "index rebuild scan" },
    { id: "analyze", label: "Analyze Workspace", icon: Network, group: "Workspace", action: () => { go("/inspector"); toast.success("Analyzing…"); }, keywords: "analyze dependencies graph" },
    { id: "open-inspector", label: "Open Inspector", icon: Boxes, group: "Workspace", action: () => go("/inspector"), keywords: "inspector intelligence" },
    // AI
    { id: "ai-chat", label: "Open AI Chat", icon: Bot, group: "AI", action: () => go("/chat"), keywords: "chat assistant ai" },
    { id: "ai-settings", label: "Open AI Settings", icon: Bot, group: "AI", action: () => go("/ai-settings"), keywords: "ai settings provider model" },
    { id: "switch-provider", label: "Switch AI Provider", hint: ai.provider, icon: Zap, group: "AI", action: () => { go("/ai-settings"); toast.info("Change provider in AI Settings"); }, keywords: "provider switch openrouter forge" },
    { id: "switch-model", label: "Switch AI Model", hint: ai.model || "not selected", icon: Sparkles, group: "AI", action: () => { go("/ai-settings"); toast.info("Change model in AI Settings"); }, keywords: "model switch glm" },
    // Theme
    { id: "theme-light", label: "Switch Theme: Light", icon: Sun, group: "Theme", action: () => { setTheme("light"); toast.success("Light theme"); }, keywords: "theme light" },
    { id: "theme-dark", label: "Switch Theme: Dark", icon: Moon, group: "Theme", action: () => { setTheme("dark"); toast.success("Dark theme"); }, keywords: "theme dark" },
    { id: "theme-system", label: "Switch Theme: System", icon: Monitor, group: "Theme", action: () => { setTheme("system"); toast.success("System theme"); }, keywords: "theme system" },
    // Settings
    { id: "open-settings", label: "Open Settings", icon: Settings, group: "Settings", action: () => go("/settings"), keywords: "settings preferences" },
    // Generate (Phase 4 placeholders)
    { id: "gen-widget", label: "Generate Widget", icon: Braces, group: "Generate (Phase 4)", action: () => toast.info("Widget generator arrives in Phase 4"), keywords: "generate widget create flutter" },
    { id: "gen-screen", label: "Generate Screen", icon: FileCode, group: "Generate (Phase 4)", action: () => toast.info("Screen generator arrives in Phase 4"), keywords: "generate screen page create" },
    { id: "gen-service", label: "Generate Service", icon: Server, group: "Generate (Phase 4)", action: () => toast.info("Service generator arrives in Phase 4"), keywords: "generate service create" },
    { id: "gen-provider", label: "Generate Riverpod Provider", icon: Zap, group: "Generate (Phase 4)", action: () => toast.info("Provider generator arrives in Phase 4"), keywords: "generate riverpod provider create" },
    { id: "gen-model", label: "Generate Model", icon: Database, group: "Generate (Phase 4)", action: () => toast.info("Model generator arrives in Phase 4"), keywords: "generate model create data" },
    { id: "gen-repo", label: "Generate Repository", icon: Package, group: "Generate (Phase 4)", action: () => toast.info("Repository generator arrives in Phase 4"), keywords: "generate repository create" },
    { id: "new-file", label: "New File", icon: FilePlus, group: "Generate (Phase 4)", action: () => toast.info("File creation arrives in Phase 4"), keywords: "new file create" },
    // Format (placeholder)
    { id: "format-file", label: "Format File", icon: Wrench, group: "Format (Phase 4)", action: () => toast.info("Dart formatter arrives in Phase 4"), keywords: "format dart fmt" },
    { id: "format-project", label: "Format Project", icon: Wrench, group: "Format (Phase 4)", action: () => toast.info("Project formatter arrives in Phase 4"), keywords: "format project dart fmt" },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} value={search} onValueChange={setSearch} />
      <CommandList className="ff-scroll">
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Files (shown in "all" and "files" modes) */}
        {mode !== "commands" && (
          <>
            <CommandGroup heading="Quick Open">
              {files.slice(0, 10).map((f) => (
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
          </>
        )}

        {/* Commands (shown in "all" and "commands" modes) */}
        {mode !== "files" && (
          <>
            {groupBy(commands, "Navigate").length > 0 && mode !== "commands" && (
              <CommandGroup heading="Navigate">
                {groupBy(commands, "Navigate").map((c) => (
                  <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                    <c.icon className="mr-2 h-4 w-4" />
                    {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {groupBy(commands, "Workspace").length > 0 && (
              <CommandGroup heading="Workspace">
                {groupBy(commands, "Workspace").map((c) => (
                  <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                    <c.icon className="mr-2 h-4 w-4" />
                    {c.label}
                    {c.hint && <span className="ml-auto text-xs text-muted-foreground">{c.hint}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="AI">
              {groupBy(commands, "AI").map((c) => (
                <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                  <c.icon className="mr-2 h-4 w-4" />
                  {c.label}
                  {c.hint && <span className="ml-auto text-xs text-muted-foreground">{c.hint}</span>}
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandGroup heading="Theme">
              {groupBy(commands, "Theme").map((c) => (
                <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                  <c.icon className="mr-2 h-4 w-4" />
                  {c.label}
                </CommandItem>
              ))}
            </CommandGroup>

            {mode === "commands" && (
              <CommandGroup heading="Generate (Phase 4)">
                {groupBy(commands, "Generate (Phase 4)").map((c) => (
                  <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                    <c.icon className="mr-2 h-4 w-4" />
                    {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {mode === "commands" && (
              <CommandGroup heading="Format (Phase 4)">
                {groupBy(commands, "Format (Phase 4)").map((c) => (
                  <CommandItem key={c.id} value={`${c.label} ${c.keywords ?? ""}`} onSelect={() => { c.action(); setOpen(false); }}>
                    <c.icon className="mr-2 h-4 w-4" />
                    {c.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}

        {/* Projects + Templates (only in "all" mode) */}
        {mode === "all" && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Projects">
              {projects.slice(0, 6).map((p) => (
                <CommandItem key={p.id} value={`project ${p.name} ${p.description}`} onSelect={() => go("/workspace")}>
                  <Rocket className="mr-2 h-4 w-4" />
                  {p.name}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Templates">
              {templates.slice(0, 4).map((t) => (
                <CommandItem key={t.id} value={`template ${t.name} ${t.description}`} onSelect={() => go("/templates")}>
                  <LayoutTemplate className="mr-2 h-4 w-4" />
                  {t.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>

      {/* Footer hint */}
      <div className="flex items-center justify-between border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
        <span>
          {mode === "files" ? "📁 File quick-open" : mode === "commands" ? "⚙ Commands" : "🔍 Everything"}
        </span>
        <span>
          <kbd className="rounded border border-border bg-muted px-1">↑↓</kbd> navigate ·{" "}
          <kbd className="rounded border border-border bg-muted px-1">↵</kbd> select ·{" "}
          <kbd className="rounded border border-border bg-muted px-1">esc</kbd> close
        </span>
      </div>
    </CommandDialog>
  );
}

function groupBy(cmds: Command[], group: string): Command[] {
  return cmds.filter((c) => c.group === group);
}
