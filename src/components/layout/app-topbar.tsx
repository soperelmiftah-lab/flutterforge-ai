"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Search,
  PanelRight,
  PanelBottom,
  Command as CommandIcon,
  Bell,
  Settings,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/common/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { appNavItems } from "@/config/navigation";
import { useUIStore } from "@/stores";
import { Logo } from "@/components/common/logo";
import { cn } from "@/lib/utils";

/**
 * Application top bar — page context, global search trigger, panel toggles,
 * notifications, theme, and user menu. Also hosts the mobile navigation sheet.
 */
export function AppTopbar() {
  const pathname = usePathname();
  const {
    mobileNavOpen,
    setMobileNavOpen,
    toggleSidebar,
    toggleRightPanel,
    toggleBottomPanel,
    rightPanelOpen,
    bottomPanelOpen,
    setCommandPaletteOpen,
  } = useUIStore();

  const current = appNavItems.find(
    (i) => pathname === i.href || pathname.startsWith(i.href)
  );

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/80 px-3 backdrop-blur-xl">
      {/* Mobile nav */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center border-b border-border px-4">
            <Logo size={28} />
          </div>
          <nav className="space-y-0.5 p-3">
            {appNavItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileNavOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-[1.15rem] w-[1.15rem]" />
                  {item.title}
                  {item.badge && (
                    <Badge variant="outline" className="ml-auto text-[9px]">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Sidebar toggle (desktop) */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <Menu className="h-[1.1rem] w-[1.1rem]" />
      </Button>

      {/* Breadcrumb / context */}
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden font-medium text-foreground sm:inline">
          {current?.title ?? "FlutterForge"}
        </span>
        {current?.description && (
          <span className="hidden text-xs text-muted-foreground lg:inline">
            · {current.description}
          </span>
        )}
      </div>

      {/* Search / command palette trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="group ml-2 hidden h-9 flex-1 max-w-md items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">Search or run a command…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground md:inline-flex">
          <CommandIcon className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1">
        {/* Panel toggles */}
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden lg:inline-flex", rightPanelOpen && "text-primary")}
          onClick={toggleRightPanel}
          aria-label="Toggle preview panel"
        >
          <PanelRight className="h-[1.1rem] w-[1.1rem]" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn("hidden lg:inline-flex", bottomPanelOpen && "text-primary")}
          onClick={toggleBottomPanel}
          aria-label="Toggle bottom panel"
        >
          <PanelBottom className="h-[1.1rem] w-[1.1rem]" />
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-[1.1rem] w-[1.1rem]" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <ThemeToggle />

        <UserMenu />
      </div>
    </header>
  );
}

function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 gap-1.5 px-1.5" aria-label="User menu">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
              FO
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">Forge Operator</span>
          <span className="text-xs font-normal text-muted-foreground">operator@flutterforge.ai</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <User className="mr-2 h-4 w-4" /> Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
