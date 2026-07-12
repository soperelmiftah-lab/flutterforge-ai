"use client";

import * as React from "react";
import {
  Settings as SettingsIcon,
  Palette,
  Code2,
  Type,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  Bell,
  Keyboard,
  Globe,
  Zap,
} from "lucide-react";
import { useTheme } from "next-themes";
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
import { useSettingsStore, defaultSettings } from "@/stores";
import type { EditorTheme, ThemeMode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "ja", label: "日本語" },
  { value: "zh", label: "中文" },
  { value: "th", label: "ไทย" },
];

export default function SettingsPage() {
  const settings = useSettingsStore();
  const { theme, setTheme } = useTheme();

  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Personalize your FlutterForge workspace."
        icon={SettingsIcon}
        actions={
          <Button variant="outline" size="sm" onClick={() => { settings.reset(); toast.success("Settings reset to defaults"); }}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Reset
          </Button>
        }
      />

      <div className="mt-6 space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4 text-primary" /> Appearance
            </CardTitle>
            <CardDescription>Choose how FlutterForge looks.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Theme</Label>
                <p className="text-xs text-muted-foreground">Light, dark, or follow your system.</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { v: "light", icon: Sun, label: "Light" },
                  { v: "dark", icon: Moon, label: "Dark" },
                  { v: "system", icon: Monitor, label: "System" },
                ] as { v: ThemeMode; icon: typeof Sun; label: string }[]).map((opt) => {
                  const Icon = opt.icon;
                  const active = theme === opt.v;
                  return (
                    <button
                      key={opt.v}
                      onClick={() => {
                        setTheme(opt.v);
                        settings.setTheme(opt.v);
                      }}
                      className={cn(
                        "flex h-16 w-20 flex-col items-center justify-center gap-1 rounded-lg border text-xs transition-all",
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Language</Label>
                <p className="text-xs text-muted-foreground">Interface language.</p>
              </div>
              <Select
                value={settings.language}
                onValueChange={(v) => settings.setLanguage(v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Code2 className="h-4 w-4 text-primary" /> Editor
            </CardTitle>
            <CardDescription>Configure the Monaco editor experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">Editor theme</Label>
                <p className="text-xs text-muted-foreground">Syntax color scheme.</p>
              </div>
              <Select
                value={settings.editorTheme}
                onValueChange={(v) => settings.setEditorTheme(v as EditorTheme)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forge-dark">Forge Dark</SelectItem>
                  <SelectItem value="forge-light">Forge Light</SelectItem>
                  <SelectItem value="vs-dark">VS Dark</SelectItem>
                  <SelectItem value="light">VS Light</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm">Font size</Label>
                <p className="text-xs text-muted-foreground">{settings.fontSize}px</p>
              </div>
              <div className="w-48">
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([v]) => settings.setFontSize(v)}
                  min={10}
                  max={24}
                  step={1}
                />
              </div>
            </div>

            <Separator />

            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Label className="text-sm">Tab size</Label>
                <p className="text-xs text-muted-foreground">Spaces per indent.</p>
              </div>
              <Select
                value={String(settings.tabSize)}
                onValueChange={(v) => settings.setTabSize(Number(v))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 4, 8].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} spaces
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <ToggleRow
              icon={Type}
              label="Word wrap"
              description="Wrap long lines instead of horizontal scroll."
              checked={settings.wordWrap}
              onChange={settings.setWordWrap}
            />
            <Separator />
            <ToggleRow
              icon={Code2}
              label="Minimap"
              description="Show the code minimap in the editor."
              checked={settings.minimap}
              onChange={settings.setMinimap}
            />
            <Separator />
            <ToggleRow
              icon={Keyboard}
              label="Line numbers"
              description="Show line numbers in the gutter."
              checked={settings.lineNumbers}
              onChange={settings.setLineNumbers}
            />
          </CardContent>
        </Card>

        {/* Behavior */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-primary" /> Behavior
            </CardTitle>
            <CardDescription>How FlutterForge saves and syncs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow
              icon={Save}
              label="Auto-save"
              description="Automatically save files as you edit."
              checked={settings.autoSave}
              onChange={settings.setAutoSave}
            />
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <Label className="text-sm">Cloud sync</Label>
                  <p className="text-xs text-muted-foreground">Sync projects via Supabase (Phase 4).</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Coming Phase 4</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-4 w-4 text-primary" /> Notifications
            </CardTitle>
            <CardDescription>Choose what FlutterForge tells you about.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleRow
              icon={Bell}
              label="Build completion"
              description="Notify when a build finishes."
              checked
              onChange={() => {}}
            />
            <Separator />
            <ToggleRow
              icon={Bell}
              label="AI agent updates"
              description="Notify when the AI agent finishes a task."
              checked
              onChange={() => {}}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={() => toast.success("Settings saved")}>
            <Save className="mr-1.5 h-4 w-4" /> Save changes
          </Button>
        </div>
      </div>

      <div className="mt-6 text-xs text-muted-foreground">
        Defaults: theme {defaultSettings.theme} · font {defaultSettings.fontSize}px · tab {defaultSettings.tabSize}
      </div>
    </PageContainer>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <Label className="text-sm">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export { Input };
