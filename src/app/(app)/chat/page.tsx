"use client";

import { Bot, MessageSquare, Sparkles, Send, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { ComingSoon } from "@/components/common/coming-soon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const suggestedPrompts = [
  "Create a stateless widget for a product card",
  "Explain Riverpod vs Bloc for state management",
  "Add a bottom navigation bar with 3 tabs",
  "Refactor this widget to use a Consumer",
];

export default function ChatPage() {
  return (
    <PageContainer>
      <PageHeader
        title="AI Chat"
        description="Conversational AI assistant for Flutter development."
        icon={MessageSquare}
        badge="Phase 2"
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="flex h-[560px] flex-col">
              {/* messages area */}
              <div className="flex-1">
                <ComingSoon
                  icon={Bot}
                  title="AI Coding Agent"
                  description="A context-aware agent that writes, edits, and reviews Flutter code. Connects to OpenRouter and Ollama in Phase 2."
                  badge="Phase 2"
                />
              </div>
              {/* input */}
              <div className="border-t border-border p-3">
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-1.5 pl-3">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <input
                    disabled
                    placeholder="AI chat activates in Phase 2…"
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                  <Button size="icon" disabled className="h-8 w-8 shrink-0">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-foreground">Try asking</h2>
          <div className="space-y-2">
            {suggestedPrompts.map((p) => (
              <div
                key={p}
                className="rounded-lg border border-border/70 bg-card p-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
              >
                {p}
              </div>
            ))}
          </div>

          <Card className="mt-6">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Model routing</span>
                <Badge variant="outline" className="ml-auto text-[10px]">Planned</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Phase 2 adds OpenRouter & Ollama routing, plus an MCP layer so you
                can bring your own models and tools.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full">
                <Link href="/about">
                  See the roadmap <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
