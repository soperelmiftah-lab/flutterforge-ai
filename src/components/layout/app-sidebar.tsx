"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, Plus, Sparkles } from "lucide-react";
import { Logo } from "@/components/common/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { appNavItems } from "@/config/navigation";
import { useUIStore } from "@/stores";
import { cn } from "@/lib/utils";

/**
 * Application sidebar — primary navigation rail. Collapses to an icon-only
 * rail on desktop and is hidden on mobile (driven by the UI store's
 * mobileNavOpen flag via a Sheet in the topbar).
 */
export function AppSidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useUIStore();

  return (
    <aside
      className={cn(
        "relative z-30 flex h-full flex-col border-r border-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-60"
      )}
    >
      {/* Brand */}
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <Link href="/" className="flex items-center" aria-label="FlutterForge AI">
          {sidebarCollapsed ? (
            <Logo showText={false} size={30} />
          ) : (
            <Logo size={28} />
          )}
        </Link>
        {!sidebarCollapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 text-muted-foreground"
            onClick={() => setSidebarCollapsed(true)}
            aria-label="Collapse sidebar"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New project */}
      <div className="p-3">
        {sidebarCollapsed ? (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild size="icon" className="h-9 w-9">
                  <Link href="/projects?new=1">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New project</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <Button asChild className="w-full justify-start" size="sm">
            <Link href="/projects?new=1">
              <Plus className="mr-1.5 h-4 w-4" /> New project
            </Link>
          </Button>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="ff-scroll flex-1 px-2">
        <nav className="space-y-0.5 pb-4">
          {appNavItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;
            const link = (
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                  sidebarCollapsed && "justify-center px-0",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "h-[1.15rem] w-[1.15rem] shrink-0",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {!sidebarCollapsed && <span className="truncate">{item.title}</span>}
                {!sidebarCollapsed && item.badge && (
                  <Badge variant="outline" className="ml-auto text-[9px] uppercase tracking-wide">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            );

            if (sidebarCollapsed) {
              return (
                <TooltipProvider key={item.href} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right" className="flex items-center gap-2">
                      {item.title}
                      {item.badge && (
                        <Badge variant="outline" className="text-[9px]">{item.badge}</Badge>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            }
            return <React.Fragment key={item.href}>{link}</React.Fragment>;
          })}
        </nav>
      </ScrollArea>

      {/* Footer: upgrade card / version */}
      {!sidebarCollapsed && (
        <div className="border-t border-sidebar-border p-3">
          <Link
            href="/about"
            className="block rounded-lg border border-primary/20 bg-primary/5 p-3 transition-colors hover:bg-primary/10"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground">Phase 1 · Foundation</span>
            </div>
            <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
              AI, preview & build engines arrive in later phases.
            </p>
          </Link>
        </div>
      )}

      {/* Expand button when collapsed */}
      {sidebarCollapsed && (
        <div className="border-t border-sidebar-border p-3">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
                  onClick={() => setSidebarCollapsed(false)}
                  aria-label="Expand sidebar"
                >
                  <ChevronsLeft className="h-4 w-4 rotate-180" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </aside>
  );
}

export { Separator };
