export interface Template {
  id: string;
  name: string;
  description: string;
  category: "Mobile" | "Web" | "Desktop" | "Fullstack" | "AI";
  framework: string;
  tags: string[];
  popularity: number;
  accent: string; // tailwind gradient classes
  icon: string; // emoji placeholder for now
}

/**
 * Curated starter templates. Mock data for phase 1 — in future phases these
 * will be sourced from a template registry / GitHub.
 */
export const templates: Template[] = [
  {
    id: "tpl-counter",
    name: "Counter App",
    description:
      "The classic Flutter counter — the perfect starting point to learn the framework.",
    category: "Mobile",
    framework: "Flutter 3.x",
    tags: ["beginner", "stateful", "material"],
    popularity: 98,
    accent: "from-emerald-500/20 to-teal-500/10",
    icon: "🔢",
  },
  {
    id: "tpl-todo",
    name: "Todo Master",
    description:
      "A production-grade todo app with persistence, theming and clean architecture.",
    category: "Mobile",
    framework: "Flutter 3.x",
    tags: ["intermediate", "hive", "riverpod"],
    popularity: 92,
    accent: "from-violet-500/20 to-fuchsia-500/10",
    icon: "✅",
  },
  {
    id: "tpl-chat",
    name: "AI Chat UI",
    description:
      "Streaming chat interface scaffold designed for LLM-powered assistants.",
    category: "AI",
    framework: "Flutter 3.x",
    tags: ["ai", "streaming", "markdown"],
    popularity: 88,
    accent: "from-rose-500/20 to-orange-500/10",
    icon: "💬",
  },
  {
    id: "tpl-ecommerce",
    name: "E-Commerce Starter",
    description:
      "Storefront with product grid, cart, and checkout flow ready to customize.",
    category: "Fullstack",
    framework: "Flutter 3.x",
    tags: ["ecommerce", "stripe", "advanced"],
    popularity: 81,
    accent: "from-amber-500/20 to-yellow-500/10",
    icon: "🛒",
  },
  {
    id: "tpl-dashboard",
    name: "Admin Dashboard",
    description:
      "Responsive admin panel with charts, tables, and a sidebar navigation.",
    category: "Web",
    framework: "Flutter Web",
    tags: ["responsive", "charts", "admin"],
    popularity: 76,
    accent: "from-cyan-500/20 to-sky-500/10",
    icon: "📊",
  },
  {
    id: "tpl-auth",
    name: "Auth Flow",
    description:
      "Complete authentication flow with login, register, and protected routes.",
    category: "Mobile",
    framework: "Flutter 3.x",
    tags: ["auth", "firebase", "forms"],
    popularity: 84,
    accent: "from-emerald-500/20 to-green-500/10",
    icon: "🔐",
  },
];
