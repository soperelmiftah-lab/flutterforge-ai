import {
  LayoutDashboard,
  Code2,
  MessageSquare,
  FolderKanban,
  LayoutTemplate,
  History,
  Settings,
  Bot,
  Boxes,
  Cpu,
  Brain,
  Wand2,
  Eye,
  ScanEye,
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
    title: "Inspector",
    href: "/inspector",
    icon: Boxes,
    description: "Project intelligence & code analysis",
  },
  {
    title: "Execution",
    href: "/execution",
    icon: Cpu,
    description: "Agent runtime & tool execution",
  },
  {
    title: "Planner",
    href: "/planner",
    icon: Brain,
    description: "Agent OS: planner, orchestrator & registry",
  },
  {
    title: "Tool Intelligence",
    href: "/tool-intelligence",
    icon: Wand2,
    description: "Tool selection, chaining & optimization",
  },
  {
    title: "Visual Runtime",
    href: "/visual",
    icon: Eye,
    description: "Device bridge, screenshots & visual inspection",
  },
  {
    title: "Vision AI",
    href: "/vision-ai",
    icon: ScanEye,
    description: "UI analysis, issue detection & recommendations",
  },
  {
    title: "Autonomous",
    href: "/autonomous",
    icon: Bot,
    description: "Autonomous engineering & repair pipeline",
  },
  {
    title: "AI Chat",
    href: "/chat",
    icon: MessageSquare,
    description: "Conversational AI assistant",
  },
  {
    title: "AI Settings",
    href: "/ai-settings",
    icon: Bot,
    description: "Configure AI providers & models",
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
