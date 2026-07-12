import {
  LayoutDashboard,
  Code2,
  MessageSquare,
  FolderKanban,
  LayoutTemplate,
  History,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
  badge?: string;
}

/**
 * Primary navigation for the application shell. Driven by config so new
 * modules can be added without touching the sidebar component.
 */
export const appNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview, recent projects & quick start",
  },
  {
    title: "Workspace",
    href: "/workspace",
    icon: Code2,
    description: "Editor, explorer & preview",
  },
  {
    title: "AI Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "Conversational AI assistant",
    badge: "Soon",
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "Manage all your Flutter projects",
  },
  {
    title: "Templates",
    href: "/templates",
    icon: LayoutTemplate,
    description: "Starter templates & blueprints",
  },
  {
    title: "History",
    href: "/history",
    icon: History,
    description: "Activity & session history",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Preferences & configuration",
  },
];
