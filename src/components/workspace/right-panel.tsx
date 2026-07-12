"use client";

import * as React from "react";
import { Smartphone, Bot, Send, Sparkles, Square } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useChatStore } from "@/stores/chat-store";
import { useAIStore } from "@/stores/ai-store";
import { toast } from "sonner";

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
  const { messages, streaming, send, stop, clear } = useChatStore();
  const ai = useAIStore();
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    const content = value.trim();
    if (!content || streaming) return;
    if (!ai.model) {
      toast.error("Select a model in AI Settings first");
      return;
    }
    send(content);
    setValue("");
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages */}
      <div ref={scrollRef} className="ff-scroll min-h-0 flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bot className="h-5 w-5" />
            </div>
            <p className="text-xs text-muted-foreground">Ask about your Flutter code…</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => (
              <div key={m.id} className={cn("flex gap-2", m.role === "user" && "flex-row-reverse")}>
                <div className={cn("max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs", m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>
                  <div className="whitespace-pre-wrap break-words">{m.content || (streaming && m.role === "assistant" ? "…" : "")}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border p-2.5">
        <div className="flex items-end gap-1.5 rounded-md border border-border bg-muted/30 p-1 pl-2.5">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask the AI…"
            className="flex-1 bg-transparent py-1 text-xs outline-none placeholder:text-muted-foreground"
            disabled={streaming}
          />
          {streaming ? (
            <Button size="icon" variant="destructive" className="h-6 w-6 shrink-0" onClick={stop}>
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button size="icon" className="h-6 w-6 shrink-0" onClick={handleSend} disabled={!value.trim()}>
              <Send className="h-3 w-3" />
            </Button>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between">
          {messages.length > 0 && (
            <button onClick={clear} className="text-[10px] text-muted-foreground hover:text-foreground">
              Clear
            </button>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground">
            {ai.provider} · {streaming ? "Streaming…" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
