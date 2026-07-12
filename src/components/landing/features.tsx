import {
  Code2,
  Bot,
  Smartphone,
  Package,
  Bug,
  GitBranch,
  Boxes,
  Network,
  type LucideIcon,
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "live" | "planned";
}

const features: Feature[] = [
  {
    icon: Code2,
    title: "Monaco editor workspace",
    description:
      "A VSCode-grade editor with tabs, syntax highlighting, themes and an unsaved-changes indicator — purpose-built for Dart & Flutter.",
    status: "live",
  },
  {
    icon: Bot,
    title: "AI coding agent",
    description:
      "A conversational agent that understands your project, edits files in place, and explains Flutter concepts with full context.",
    status: "planned",
  },
  {
    icon: Smartphone,
    title: "Live & device preview",
    description:
      "Hot-reload web preview plus an Android device bridge so you can see your app on real form factors instantly.",
    status: "planned",
  },
  {
    icon: Package,
    title: "APK builder pipeline",
    description:
      "Ship installable builds straight from the browser. Managed Flutter build engine, no local toolchain required.",
    status: "planned",
  },
  {
    icon: Bug,
    title: "Debug & review agents",
    description:
      "Specialized agents that catch null-safety issues, widget tree problems, and performance regressions before you ship.",
    status: "planned",
  },
  {
    icon: GitBranch,
    title: "GitHub & cloud sync",
    description:
      "Optional GitHub, Supabase and Firebase integrations with secure, opt-in cloud storage for projects.",
    status: "planned",
  },
  {
    icon: Boxes,
    title: "Plugin system",
    description:
      "Extend the studio with first- and third-party plugins. Add new languages, tools, and panel surfaces.",
    status: "planned",
  },
  {
    icon: Network,
    title: "MCP & model routing",
    description:
      "Model Context Protocol support plus OpenRouter and Ollama routing let you bring your own models and tools.",
    status: "planned",
  },
];

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20 border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Everything you need
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            One workspace. The whole Flutter lifecycle.
          </h2>
          <p className="mt-4 text-muted-foreground">
            FlutterForge is architected as a modular platform. Phase 1 ships the
            foundation — the rest slots in without rewrites.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-border/70 bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mb-1.5 flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.description}
                </p>
                <span
                  className={`absolute right-4 top-4 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    f.status === "live"
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {f.status === "live" ? "Live" : "Planned"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
