"use client";

import * as React from "react";
import { Smartphone, Bot, Send, Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RightPanelProps {
  tab: "preview" | "chat";
  onTabChange: (t: "preview" | "chat") => void;
}

/**
 * Right panel — reserved for the live preview (Phase 3) and AI chat (Phase 2).
 * Both surfaces render as polished placeholders today, with tab switching so
 * the UX shape is locked in ahead of implementation.
 */
export function RightPanel({ tab, onTabChange }: RightPanelProps) {
  return (
    <div className="flex h-full flex-col bg-background">
      {/* Tabs */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border px-2">
        <TabButton active={tab === "preview"} onClick={() => onTabChange("preview")}>
          <Smartphone className="h-3.5 w-3.5" /> Preview
        </TabButton>
        <TabButton active={tab === "chat"} onClick={() => onTabChange("chat")}>
          <Bot className="h-3.5 w-3.5" /> AI Chat
          <Badge variant="outline" className="ml-1 text-[9px]">Soon</Badge>
        </TabButton>
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1">
        {tab === "preview" ? <PreviewPlaceholder /> : <ChatPlaceholder />}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

function PreviewPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-muted/20 p-6">
      {/* Phone frame mockup */}
      <div className="relative mb-6">
        <div className="h-[360px] w-[180px] rounded-[2rem] border-4 border-foreground/80 bg-background p-2 shadow-2xl">
          <div className="flex h-full flex-col rounded-[1.4rem] bg-gradient-to-b from-primary/10 to-background">
            <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-foreground/30" />
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="h-2 w-20 rounded-full bg-foreground/10" />
              <div className="h-2 w-14 rounded-full bg-foreground/10" />
              <div className="mt-3 h-8 w-24 rounded-lg bg-primary/80" />
            </div>
          </div>
        </div>
        <span className="absolute -right-2 -top-2 h-3 w-3 rounded-full bg-primary ff-pulse" />
      </div>
      <ComingSoon
        icon={Smartphone}
        title="Live Preview"
        description="Hot-reload web preview and an Android device bridge arrive in Phase 3."
        badge="Phase 3"
      />
    </div>
  );
}

function ChatPlaceholder() {
  const [value, setValue] = React.useState("");
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ComingSoon
          icon={Bot}
          title="AI Coding Agent"
          description="A context-aware agent that edits files, explains Flutter concepts, and reviews your code. Arrives in Phase 2."
          badge="Phase 2"
        />
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask the agent anything…"
            className="h-9"
            onKeyDown={(e) => {
              if (e.key === "Enter") setValue("");
            }}
          />
          <Button size="icon" className="h-9 w-9 shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          The AI agent connects to OpenRouter & Ollama in Phase 2.
        </p>
      </div>
    </div>
  );
}
