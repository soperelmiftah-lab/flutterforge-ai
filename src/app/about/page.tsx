import Link from "next/link";
import {
  Info,
  Layers,
  Code2,
  Bot,
  Smartphone,
  Package,
  GitBranch,
  Boxes,
  Network,
  ArrowRight,
  Github,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { roadmap } from "@/config/roadmap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Logo } from "@/components/common/logo";

export const metadata = {
  title: "About",
};

const stack = [
  { icon: Code2, label: "Next.js 16 · React 19 · TypeScript" },
  { icon: Layers, label: "Tailwind CSS 4 · shadcn/ui · Radix" },
  { icon: Bot, label: "Model-agnostic AI layer (planned)" },
  { icon: Smartphone, label: "Flutter / Dart build engine (planned)" },
  { icon: Package, label: "Prisma · SQLite (client) → PostgreSQL" },
  { icon: Network, label: "WebSocket realtime (planned)" },
];

const modules = [
  { icon: Bot, name: "AI Engine", desc: "Coding agent, model routing, MCP" },
  { icon: Smartphone, name: "Preview Engine", desc: "Hot-reload web + Android bridge" },
  { icon: Package, name: "Flutter Engine", desc: "Build & APK pipeline" },
  { icon: Code2, name: "Debug Engine", desc: "Lint, trace, performance agents" },
  { icon: Boxes, name: "Agent Manager", desc: "Multi-agent orchestration" },
  { icon: Network, name: "Integrations", desc: "GitHub, Supabase, Firebase, OpenRouter, Ollama" },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="Home">
            <Logo />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">Open workspace <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6">
        {/* Hero */}
        <div className="text-center">
          <Badge variant="outline" className="mb-4 gap-1.5 rounded-full px-3 py-1">
            <Sparkles className="h-3 w-3" /> Phase 1 · Foundation
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            About {siteConfig.name}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            {siteConfig.tagline} A browser-based, AI-native development studio
            specialized for Flutter — architected to grow into a Flutter-focused
            alternative to Google AI Studio.
          </p>
        </div>

        {/* Mission */}
        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-primary" /> Our mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              Flutter is a remarkably productive toolkit, but the surrounding
              toolchain — building, previewing, debugging, shipping — still
              demands a heavy local setup. FlutterForge AI removes that friction.
            </p>
            <p>
              We&apos;re building a single, AI-native environment where you can
              create a Flutter app, talk to an agent that genuinely understands
              your codebase, preview on real devices, and ship an installable
              build — all from the browser.
            </p>
            <p>
              Phase 1 establishes the foundation: a polished workspace, a
              Monaco-grade editor, a clean modular architecture, and the state &
              routing scaffolding the AI, preview, and build engines will plug
              into over the coming phases.
            </p>
          </CardContent>
        </Card>

        {/* Tech stack */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Technology stack</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stack.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-4"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-foreground">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modular architecture */}
        <div className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Modular architecture
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Every capability is an isolated module with a clear boundary, so
            future features compose instead of clashing.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => {
              const Icon = m.icon;
              return (
                <Card key={m.name} className="border-border/70">
                  <CardContent className="p-4">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{m.name}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Roadmap */}
        <div className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
            <GitBranch className="h-5 w-5 text-primary" /> Roadmap
          </h2>
          <div className="space-y-3">
            {roadmap.map((phase) => (
              <div
                key={phase.phase}
                className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-4 sm:flex-row sm:items-center"
              >
                <div className="sm:w-40">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {phase.phase}
                  </div>
                  <div className="text-sm font-medium text-foreground">{phase.title}</div>
                </div>
                <Separator orientation="vertical" className="hidden h-10 sm:block" />
                <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1">
                  {phase.items.slice(0, 4).map((item) => (
                    <span key={item} className="text-xs text-muted-foreground">
                      · {item}
                    </span>
                  ))}
                </div>
                <Badge
                  variant={phase.status === "active" ? "default" : "outline"}
                  className="text-[10px]"
                >
                  {phase.eta}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-14 flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Ready to forge your first app?
          </h2>
          <p className="max-w-md text-sm text-muted-foreground">
            Jump into the workspace and explore the foundation we&apos;ve built.
          </p>
          <div className="flex gap-2">
            <Button asChild>
              <Link href="/dashboard">Open dashboard <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={siteConfig.links.github} target="_blank" rel="noreferrer">
                <Github className="mr-1.5 h-4 w-4" /> View source
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {siteConfig.name} · v{siteConfig.version}
      </footer>
    </div>
  );
}
