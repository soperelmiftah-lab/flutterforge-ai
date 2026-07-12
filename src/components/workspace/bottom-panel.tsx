"use client";

import { useState } from "react";
import { Terminal, X, ChevronDown } from "lucide-react";
import { ComingSoon } from "@/components/common/coming-soon";
import { useUIStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const tabs = ["Terminal", "Problems", "Output", "Debug Console"];

/**
 * Bottom panel — reserved terminal/problems/output surface. Collapsible via
 * the UI store and toggled from the workspace toolbar.
 */
export function BottomPanel() {
  const { bottomPanelOpen, toggleBottomPanel } = useUIStore();
  const [active, setActive] = useState(tabs[0]);

  if (!bottomPanelOpen) return null;

  return (
    <div className="flex h-full flex-col border-t border-border bg-background">
      <div className="flex h-8 shrink-0 items-center gap-1 border-b border-border px-2">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActive(t)}
            className={cn(
              "flex h-6 items-center gap-1.5 rounded px-2 text-xs font-medium transition-colors",
              active === t
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {t === "Terminal" && <Terminal className="h-3 w-3" />}
            {t}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground" aria-label="Collapse">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            onClick={toggleBottomPanel}
            aria-label="Close panel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ComingSoon
          icon={Terminal}
          title={active}
          description="Integrated terminal, problems view, and build output arrive in a later phase."
          badge="Reserved"
        />
      </div>
    </div>
  );
}
