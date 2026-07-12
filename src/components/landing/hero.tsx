import Link from "next/link";
import { ArrowRight, Sparkles, Play, Terminal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/config/site";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden">
      {/* ambient glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px] dark:bg-primary/25" />
        <div className="ff-grid-bg absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 flex justify-center">
            <Badge
              variant="outline"
              className="gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary"
            >
              <Sparkles className="h-3 w-3" />
              Phase 1 · Foundation release is live
            </Badge>
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
            The AI-native studio for{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Flutter
            </span>{" "}
            development
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {siteConfig.tagline} Create, edit, debug, preview, and build Flutter
            apps with AI assistance — all from your browser. A Flutter-focused
            alternative to Google AI Studio.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-11 px-6">
              <Link href="/auth/register">
                Start building free <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-11 px-6">
              <Link href="/dashboard">
                <Play className="mr-1.5 h-4 w-4" /> View the dashboard
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">
            No credit card required · Local-first · Open architecture
          </p>
        </div>

        {/* Workspace preview mockup */}
        <div className="mx-auto mt-16 max-w-5xl">
          <div className="relative rounded-2xl border border-border/70 bg-card/60 p-2 shadow-2xl shadow-primary/5 backdrop-blur ff-glow">
            <div className="overflow-hidden rounded-xl border border-border bg-background">
              <WorkspaceMock />
            </div>
          </div>
        </div>

        {/* trust strip */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> Monaco-grade editor
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" /> Built for hot-reload preview
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" /> Model-agnostic AI layer
          </span>
        </div>
      </div>
    </section>
  );
}

function WorkspaceMock() {
  return (
    <div className="grid grid-cols-12">
      {/* sidebar */}
      <div className="col-span-2 hidden border-r border-border bg-muted/30 p-3 sm:block">
        <div className="space-y-2">
          {["Dashboard", "Workspace", "AI Chat", "Projects", "Templates", "History", "Settings"].map(
            (item, i) => (
              <div
                key={item}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[11px] ${
                  i === 1 ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground"
                }`}
              >
                <div className="h-3 w-3 rounded-sm bg-current opacity-50" />
                {item}
              </div>
            )
          )}
        </div>
      </div>
      {/* explorer */}
      <div className="col-span-3 hidden border-r border-border p-3 lg:block">
        <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </div>
        <div className="space-y-1 font-mono text-[11px]">
          <div className="text-foreground">📁 lib</div>
          <div className="pl-3 text-muted-foreground">📁 features</div>
          <div className="pl-3 text-muted-foreground">📁 core</div>
          <div className="pl-3 text-primary">📄 main.dart</div>
          <div className="text-muted-foreground">📄 pubspec.yaml</div>
          <div className="text-muted-foreground">📄 README.md</div>
        </div>
      </div>
      {/* editor */}
      <div className="col-span-12 sm:col-span-10 lg:col-span-7">
        <div className="flex items-center gap-1 border-b border-border bg-muted/20 px-2 py-1.5">
          <div className="flex items-center gap-1.5 rounded-md bg-background px-2.5 py-1 text-[11px] text-foreground ring-1 ring-primary/30">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            main.dart
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-muted-foreground">
            home_screen.dart
          </div>
        </div>
        <pre className="overflow-hidden p-4 text-[11px] leading-relaxed text-muted-foreground">
          <code>
            <span className="text-violet-500">import</span> <span className="text-emerald-500">&apos;package:flutter/material.dart&apos;</span>;{"\n"}
            <span className="text-violet-500">import</span> <span className="text-emerald-500">&apos;package:flutter_riverpod/flutter_riverpod.dart&apos;</span>;{"\n\n"}
            <span className="text-violet-500">void</span> <span className="text-amber-500">main</span>() {"{"}{"\n"}
            {"  "}runApp(<span className="text-violet-500">const</span> ProviderScope(child: <span className="text-sky-500">ForgeApp</span>()));{"\n"}
            {"}"}{"\n\n"}
            <span className="text-violet-500">class</span> <span className="text-sky-500">ForgeApp</span> <span className="text-violet-500">extends</span> ConsumerWidget {"{"}{"\n"}
            {"  "}<span className="text-amber-500">build</span>(context, ref) {"=>"} MaterialApp({"\n"}
            {"    "}title: <span className="text-emerald-500">&apos;FlutterForge&apos;</span>,{"\n"}
            {"    "}theme: AppTheme.light,{"\n"}
            {"    "}home: <span className="text-violet-500">const</span> HomeScreen(),{"\n"}
            {"  "});{"\n"}
            {"}"}
          </code>
        </pre>
      </div>
    </div>
  );
}
