"use client";

import * as React from "react";
import {
  Bot,
  KeyRound,
  Sliders,
  Coins,
  Zap,
  Shield,
  Activity,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
} from "lucide-react";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAIStore } from "@/stores/ai-store";
import { useProviderStore } from "@/stores/provider-store";
import { useModelStore } from "@/stores/model-store";
import { ApiKeyManager } from "@/components/ai/api-key-manager";
import { ProviderSelector } from "@/components/ai/provider-selector";
import { ModelSelector } from "@/components/ai/model-selector";
import { ConnectionStatus } from "@/components/ai/streaming-indicator";
import { TokenCounter } from "@/components/ai/token-counter";
import { useAIHydration } from "@/hooks/use-ai-hydration";
import { aiSettingsConstraints, type ReasoningEffort } from "@/features/ai/settings/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AISettingsPage() {
  useAIHydration();
  const ai = useAIStore();
  const { providers, credentials, health, refreshHealth, refreshAllHealth } = useProviderStore();
  const { models, loading: modelsLoading } = useModelStore();

  const selectedModel = models.find((m) => m.id === ai.model);
  const currentHealth = health[ai.provider];
  const currentCred = credentials[ai.provider];

  return (
    <PageContainer>
      <PageHeader
        title="AI Settings"
        description="Configure providers, models, and generation parameters."
        icon={Bot}
        badge="Phase 2"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refreshAllHealth();
              toast.success("Health checks refreshed");
            }}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" /> Check all
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Active provider & model */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" /> Active Configuration
            </CardTitle>
            <CardDescription>The provider and model used for all AI features.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 space-y-1.5">
                <Label>Provider</Label>
                <ProviderSelector className="w-full sm:w-auto" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label>Model</Label>
                <ModelSelector className="w-full sm:w-auto" />
              </div>
            </div>

            {/* Connection status */}
            <div className="flex items-center gap-4 rounded-lg border border-border/60 bg-muted/30 p-3">
              {currentHealth ? (
                <ConnectionStatus status={currentHealth.status} />
              ) : (
                <span className="text-xs text-muted-foreground">Health: not checked</span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-7 text-xs"
                onClick={() => refreshHealth(ai.provider)}
              >
                <Activity className="mr-1 h-3 w-3" /> Test connection
              </Button>
            </div>

            {/* Selected model info */}
            {selectedModel && (
              <div className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{selectedModel.name}</span>
                  {selectedModel.isFree ? (
                    <Badge variant="secondary" className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      FREE
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">
                      ${selectedModel.inputCostPer1M.toFixed(2)}/M in
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {selectedModel.contextLength.toLocaleString()} ctx
                  </Badge>
                  {selectedModel.capabilities.vision && <Badge variant="outline" className="text-[10px]">Vision</Badge>}
                  {selectedModel.capabilities.toolCalling && <Badge variant="outline" className="text-[10px]">Tools</Badge>}
                  {selectedModel.capabilities.json && <Badge variant="outline" className="text-[10px]">JSON</Badge>}
                  {selectedModel.capabilities.reasoning && <Badge variant="outline" className="text-[10px]">Reasoning</Badge>}
                  {selectedModel.capabilities.streaming && <Badge variant="outline" className="text-[10px]">Streaming</Badge>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> API Keys
            </CardTitle>
            <CardDescription>
              Encrypted with AES-256-GCM. Keys never leave the server unencrypted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-emerald-500" />
              All keys are encrypted at rest. The browser only sees a masked view.
            </div>
            <Separator />
            {providers.map((p) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center",
                  p.id === ai.provider ? "border-primary/30 bg-primary/5" : "border-border/60"
                )}
              >
                <div className="flex flex-1 items-center gap-3">
                  <span className="text-xl">{p.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium">{p.name}</span>
                      {p.id === ai.provider && (
                        <Badge variant="secondary" className="text-[9px]">Active</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {health[p.id] && (
                    <ConnectionStatus status={health[p.id].status} className="hidden sm:inline-flex" />
                  )}
                  <ApiKeyManager provider={p} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Generation parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sliders className="h-4 w-4 text-primary" /> Generation Parameters
            </CardTitle>
            <CardDescription>Control how the AI generates responses.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ParamSlider
              label="Temperature"
              description="Higher = more creative, lower = more focused."
              value={ai.temperature}
              onChange={ai.setTemperature}
              {...aiSettingsConstraints.temperature}
            />
            <Separator />
            <ParamSlider
              label="Top P"
              description="Nucleus sampling — probability mass to consider."
              value={ai.topP}
              onChange={ai.setTopP}
              {...aiSettingsConstraints.topP}
            />
            <Separator />
            <ParamSlider
              label="Max tokens"
              description="Maximum tokens to generate per response."
              value={ai.maxTokens}
              onChange={ai.setMaxTokens}
              {...aiSettingsConstraints.maxTokens}
            />
            <Separator />
            <ParamSlider
              label="Presence penalty"
              description="Penalize tokens that have already appeared."
              value={ai.presencePenalty}
              onChange={ai.setPresencePenalty}
              {...aiSettingsConstraints.presencePenalty}
            />
            <Separator />
            <ParamSlider
              label="Frequency penalty"
              description="Penalize tokens based on how often they appeared."
              value={ai.frequencyPenalty}
              onChange={ai.setFrequencyPenalty}
              {...aiSettingsConstraints.frequencyPenalty}
            />
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Reasoning effort</Label>
                <p className="text-xs text-muted-foreground">How deeply the model reasons (if supported).</p>
              </div>
              <Select
                value={ai.reasoningEffort}
                onValueChange={(v) => ai.setReasoningEffort(v as ReasoningEffort)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <ToggleRow
              label="Streaming"
              description="Stream responses token-by-token."
              checked={ai.streaming}
              onChange={ai.setStreaming}
            />
            <Separator />
            <ToggleRow
              label="Beginner mode"
              description="Adjusts prompt tone for Flutter learners."
              checked={ai.beginnerMode}
              onChange={ai.setBeginnerMode}
            />
          </CardContent>
        </Card>

        {/* Custom instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-primary" /> Custom Instructions
            </CardTitle>
            <CardDescription>Appended to the system prompt on every request.</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={ai.customInstructions}
              onChange={(e) => ai.setCustomInstructions(e.target.value)}
              placeholder="e.g. Always use Riverpod for state management. Prefer const constructors."
              rows={3}
              className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </CardContent>
        </Card>

        {/* Token usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Coins className="h-4 w-4 text-primary" /> Token Usage
            </CardTitle>
            <CardDescription>Current session usage and context window.</CardDescription>
          </CardHeader>
          <CardContent>
            <TokenCounter
              usage={null}
              contextLength={selectedModel?.contextLength ?? ai.contextLength}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Token usage accumulates as you chat. The context bar shows how full the model's window is.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

function ParamSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1">
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-32">
          <Slider
            value={[value]}
            onValueChange={([v]) => onChange(v)}
            min={min}
            max={max}
            step={step}
          />
        </div>
        <span className="w-12 text-right text-sm font-mono text-foreground">
          {Number.isInteger(step) ? value : value.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
