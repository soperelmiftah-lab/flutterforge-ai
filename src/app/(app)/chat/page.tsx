"use client";

import * as React from "react";
import {
  Bot,
  Send,
  Sparkles,
  User,
  Trash2,
  Pin,
  PinOff,
  Copy,
  Check,
  Loader2,
  Square,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ProviderSelector } from "@/components/ai/provider-selector";
import { ModelSelector } from "@/components/ai/model-selector";
import { StreamingIndicator, ConnectionStatus } from "@/components/ai/streaming-indicator";
import { TokenCounter } from "@/components/ai/token-counter";
import { useAIStore } from "@/stores/ai-store";
import { useChatStore } from "@/stores/chat-store";
import { useProviderStore } from "@/stores/provider-store";
import { useModelStore } from "@/stores/model-store";
import { useTokenStore } from "@/stores/token-store";
import { useAIHydration } from "@/hooks/use-ai-hydration";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const suggestedPrompts = [
  "Create a stateless widget for a product card",
  "Explain Riverpod vs Bloc for state management",
  "Add a bottom navigation bar with 3 tabs",
  "Write a unit test for a counter widget",
];

export default function ChatPage() {
  useAIHydration();
  const { messages, streaming, send, stop, clear, togglePin, removeMessage, lastUsage } = useChatStore();
  const ai = useAIStore();
  const { health } = useProviderStore();
  const selectedModel = useModelStore((s) => s.models.find((m) => m.id === s.selectedModelId));
  const { recordUsage, session: tokenSession } = useTokenStore();
  const [input, setInput] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Record usage when it arrives
  React.useEffect(() => {
    if (lastUsage && selectedModel) {
      recordUsage(lastUsage, selectedModel.id, ai.provider);
    }
  }, [lastUsage, selectedModel, ai.provider, recordUsage]);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || streaming) return;
    if (!ai.model) {
      toast.error("Please select a model first");
      return;
    }
    send(content);
    setInput("");
  };

  const currentHealth = health[ai.provider];

  return (
    <PageContainer>
      <PageHeader
        title="AI Chat"
        description="Conversational AI assistant powered by the FlutterForge AI Core."
        icon={Bot}
        badge="Phase 2"
        actions={
          <div className="flex items-center gap-2">
            <ProviderSelector compact />
            <ModelSelector compact />
            <Button asChild variant="outline" size="sm">
              <Link href="/ai-settings">
                <Settings className="mr-1.5 h-4 w-4" /> Settings
              </Link>
            </Button>
          </div>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Chat area */}
        <div className="lg:col-span-3">
          <Card className="flex h-[600px] flex-col overflow-hidden">
            {/* Status bar */}
            <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border bg-muted/20 px-3">
              {currentHealth ? (
                <ConnectionStatus status={currentHealth.status} />
              ) : (
                <span className="text-xs text-muted-foreground">Not connected</span>
              )}
              <Separator orientation="vertical" className="h-4" />
              <StreamingIndicator active={streaming} />
              {!streaming && messages.length > 0 && (
                <TokenCounter
                  usage={lastUsage}
                  contextLength={selectedModel?.contextLength}
                  sessionTotal={tokenSession.totalTokens}
                  compact
                />
              )}
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => {
                    clear();
                    toast.success("Chat cleared");
                  }}
                  disabled={messages.length === 0 || streaming}
                >
                  <Trash2 className="mr-1 h-3 w-3" /> Clear
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="ff-scroll min-h-0 flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <EmptyChat onPick={(p) => handleSend(p)} />
              ) : (
                <div className="space-y-4">
                  {messages.map((m) => (
                    <MessageBubble
                      key={m.id}
                      message={m}
                      streaming={streaming}
                      onPin={() => togglePin(m.id)}
                      onRemove={() => removeMessage(m.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <div className="flex items-end gap-2 rounded-lg border border-border bg-muted/30 p-1.5 pl-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Ask about Flutter, Dart, or paste code to review…"
                  rows={1}
                  className="flex-1 resize-none bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground max-h-32"
                  style={{ minHeight: "28px" }}
                  disabled={streaming}
                />
                {streaming ? (
                  <Button size="icon" variant="destructive" className="h-8 w-8 shrink-0" onClick={stop}>
                    <Square className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter for newline · Streaming {ai.streaming ? "on" : "off"}
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar: usage + tips */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-foreground">Session usage</h3>
              <TokenCounter
                usage={lastUsage}
                contextLength={selectedModel?.contextLength}
                sessionTotal={tokenSession.totalTokens}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Sparkles className="h-3.5 w-3.5 text-primary" /> Try asking
              </h3>
              <div className="space-y-1.5">
                {suggestedPrompts.map((p) => (
                  <button
                    key={p}
                    onClick={() => handleSend(p)}
                    disabled={streaming}
                    className="block w-full rounded-md border border-border/60 bg-muted/30 p-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Provider info</h3>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Provider</span>
                  <span className="font-medium text-foreground">{ai.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Model</span>
                  <span className="font-medium text-foreground truncate ml-2 max-w-[140px]">
                    {selectedModel?.name ?? ai.model ?? "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature</span>
                  <span className="font-medium text-foreground">{ai.temperature}</span>
                </div>
                <div className="flex justify-between">
                  <span>Streaming</span>
                  <span className="font-medium text-foreground">{ai.streaming ? "On" : "Off"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

function EmptyChat({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center">
      <div className="relative mb-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bot className="h-7 w-7" />
        </div>
        <span className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-primary ff-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-foreground">AI Chat is ready</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        Ask anything about Flutter or Dart. Responses stream in real-time from your selected provider.
      </p>
      <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {suggestedPrompts.map((p) => (
          <button
            key={p}
            onClick={() => onPick(p)}
            className="rounded-lg border border-border/60 bg-card p-3 text-left text-xs text-muted-foreground transition-all hover:border-primary/40 hover:shadow-sm"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  streaming,
  onPin,
  onRemove,
}: {
  message: { id: string; role: string; content: string; pinned?: boolean };
  streaming: boolean;
  onPin: () => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === "user";
  const isAssistant = message.role === "assistant";
  const isEmpty = isAssistant && !message.content && streaming;

  const copy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("group flex gap-3", isUser && "flex-row-reverse")}>
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble */}
      <div className={cn("min-w-0 flex-1", isUser && "flex flex-col items-end")}>
        <div className="mb-0.5 flex items-center gap-1.5">
          <span className="text-xs font-medium text-foreground">
            {isUser ? "You" : "FlutterForge AI"}
          </span>
          {message.pinned && (
            <Badge variant="outline" className="h-4 text-[9px] gap-0.5">
              <Pin className="h-2.5 w-2.5" /> Pinned
            </Badge>
          )}
        </div>
        <div
          className={cn(
            "inline-block rounded-lg px-3.5 py-2.5 text-sm",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground",
            isEmpty && "flex items-center gap-1"
          )}
        >
          {isEmpty ? (
            <>
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
            </>
          ) : (
            <div className="whitespace-pre-wrap break-words">{message.content}</div>
          )}
        </div>

        {/* Actions */}
        {!streaming && message.content && (
          <div className={cn("mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100", isUser && "justify-end")}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={copy} aria-label="Copy">
              {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" onClick={onPin} aria-label={message.pinned ? "Unpin" : "Pin"}>
              {message.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={onRemove} aria-label="Delete">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
