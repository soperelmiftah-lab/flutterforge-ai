"use client";

import * as React from "react";
import { Check, KeyRound, Loader2, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useProviderStore } from "@/stores/provider-store";
import type { ProviderId, ProviderMeta } from "@/features/ai/provider/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ApiKeyManagerProps {
  provider: ProviderMeta;
}

/**
 * API Key Manager — lets the user add, view (masked), and delete API keys
 * for a provider. Keys are encrypted server-side; the client only ever sees
 * a masked view.
 */
export function ApiKeyManager({ provider }: ApiKeyManagerProps) {
  const { credentials, saveApiKey, deleteApiKey, refreshHealth } = useProviderStore();
  const cred = credentials[provider.id];
  const [open, setOpen] = React.useState(false);
  const [key, setKey] = React.useState("");
  const [show, setShow] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  const hasKey = cred?.hasKey ?? false;

  const handleSave = async () => {
    if (!key.trim()) return;
    setSaving(true);
    try {
      await saveApiKey(provider.id as ProviderId, key.trim());
      toast.success(`API key saved for ${provider.name}`);
      setKey("");
      setOpen(false);
      refreshHealth(provider.id as ProviderId);
    } catch {
      toast.error("Failed to save API key");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteApiKey(provider.id as ProviderId);
      toast.success(`API key removed for ${provider.name}`);
      refreshHealth(provider.id as ProviderId);
    } catch {
      toast.error("Failed to remove API key");
    } finally {
      setDeleting(false);
    }
  };

  if (!provider.requiresApiKey) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" /> No key needed
        </Badge>
        <span>Works out of the box</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {hasKey ? (
        <>
          <Badge variant="outline" className="gap-1.5 font-mono text-xs">
            <KeyRound className="h-3 w-3 text-emerald-500" />
            {cred?.maskedKey ?? "••••"}
          </Badge>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Replace
              </Button>
            </DialogTrigger>
            <KeyDialog
              provider={provider}
              keyValue={key}
              setKey={setKey}
              show={show}
              setShow={setShow}
              saving={saving}
              onSave={handleSave}
              onCancel={() => setOpen(false)}
            />
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete API key"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          </Button>
        </>
      ) : (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Add API key
            </Button>
          </DialogTrigger>
          <KeyDialog
            provider={provider}
            keyValue={key}
            setKey={setKey}
            show={show}
            setShow={setShow}
            saving={saving}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
          />
        </Dialog>
      )}
    </div>
  );
}

function KeyDialog({
  provider,
  keyValue,
  setKey,
  show,
  setShow,
  saving,
  onSave,
  onCancel,
}: {
  provider: ProviderMeta;
  keyValue: string;
  setKey: (v: string) => void;
  show: boolean;
  setShow: (v: boolean) => void;
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <span className="text-lg">{provider.icon}</span>
          {provider.name} API Key
        </DialogTitle>
        <DialogDescription>
          Your key is encrypted (AES-256-GCM) before storage and never sent back to the browser.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="apikey">API Key</Label>
          <div className="relative">
            <Input
              id="apikey"
              type={show ? "text" : "password"}
              value={keyValue}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Paste your API key…"
              className="pr-9 font-mono text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && onSave()}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setShow(!show)}
              aria-label={show ? "Hide key" : "Show key"}
            >
              {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
        {provider.keyUrl && (
          <a
            href={provider.keyUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Get an API key <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSave} disabled={saving || !keyValue.trim()}>
          {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
          Save & encrypt
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
