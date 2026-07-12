# FlutterForge AI

> The AI-native studio for building Flutter apps in your browser.

FlutterForge AI is a browser-based, AI-powered development environment specialized for Flutter. It brings together a Monaco-grade editor, an AI coding agent, live preview, and a build pipeline into a single workspace — designed to grow into a Flutter-focused alternative to Google AI Studio.

This repository contains **Phase 1 — the Foundation**: the application shell, editor, file explorer, project management, settings, a clean modular architecture, and the state/routing scaffolding the AI, preview, and build engines will plug into over the coming phases.

---

## ✨ Phase 1 highlights

- **App shell** — collapsible sidebar, top bar with command palette (⌘K), and an IDE-style status bar footer.
- **Monaco editor** — tabs, unsaved indicators, custom Forge themes (dark/light), ⌘S to save, full settings integration.
- **File explorer** — folder tree with expand/collapse, file-type icons, and instant filtering.
- **Project management** — create, rename, delete, favorite, filter, and search projects (mock data).
- **Dashboard** — stats, quick start, recent projects, activity feed, templates, roadmap progress.
- **Landing page** — hero, features, roadmap, pricing placeholder, FAQ, CTA.
- **Auth pages** — login & register with react-hook-form + zod validation (mock JWT flow).
- **Settings** — theme, language, font size, editor theme, tab size, word wrap, minimap, auto-save.
- **Design system** — emerald-accent theme, dark/light mode, reusable components.
- **Mock REST API** — `/api/v1/{health,version,projects,workspace,settings}`.
- **Domain schema** — Prisma models for `users`, `projects`, `project_files`, `workspaces`, `settings`, `chat_sessions`, `messages`.
- **Modular feature boundaries** — contracts for AI, preview, flutter, debug, agents, integrations, plugins, MCP, and realtime.

---

## 🧱 Tech stack

| Layer | Technology |
|------|-------------|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| Styling | Tailwind CSS 4 · shadcn/ui · Radix UI |
| Editor | Monaco (`@monaco-editor/react`) |
| State | Zustand (client) · TanStack Query (server) |
| Forms | React Hook Form · Zod |
| Database | Prisma ORM (SQLite now → PostgreSQL later) |
| Auth | NextAuth.js v4 (wired in a future phase) |
| Realtime | Socket.IO contract (Phase 2+) |

> **Note on the brief's stack:** The original brief specified a FastAPI + Python backend and a `apps/` + `packages/` monorepo. This phase is delivered as a single Next.js application (per the deployment environment) with the **same modular architecture** expressed through `src/features/*` package boundaries. The `docs/ARCHITECTURE.md` maps each `features/*` module to its future standalone package so extraction is mechanical.

---

## 🚀 Getting started

```bash
bun install          # install dependencies
bun run dev          # start the dev server on http://localhost:3000
bun run lint         # run ESLint
bun run db:push      # sync the Prisma schema to SQLite
```

Open the **Preview Panel** to view the app. The dev server runs on port 3000 only.

### Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` · `/register` | Authentication |
| `/dashboard` | Overview, recent projects, activity |
| `/workspace` | Editor, explorer, preview & chat panels |
| `/projects` | Manage all projects |
| `/templates` | Browse starter templates |
| `/history` | Activity timeline & chat sessions |
| `/settings` | Preferences |
| `/chat` | AI chat (Phase 2 placeholder) |
| `/about` | About & roadmap |
| `/api/v1/*` | Mock REST API |

---

## 📁 Project structure

```
src/
├── app/                      # Next.js App Router
│   ├── (app)/                # protected app routes (sidebar shell)
│   │   ├── dashboard/  workspace/  projects/  templates/
│   │   ├── history/    settings/   chat/
│   │   └── layout.tsx        # AppShell wrapper
│   ├── (auth)/               # public auth routes
│   │   ├── login/  register/
│   │   └── layout.tsx
│   ├── about/                # public about page
│   ├── api/v1/               # mock REST API
│   │   ├── health/  version/  projects/  workspace/  settings/
│   ├── globals.css           # design tokens (emerald theme)
│   ├── layout.tsx            # root layout + providers
│   ├── not-found.tsx         # custom 404
│   └── page.tsx              # landing page
│
├── components/
│   ├── ui/                   # shadcn/ui primitives
│   ├── layout/               # app-shell: sidebar, topbar, status bar, command palette
│   ├── landing/              # marketing sections
│   ├── common/               # logo, theme-toggle, page-header, empty-state, project-card, …
│   ├── dashboard/            # dashboard widgets
│   ├── workspace/            # toolbar, right panel, bottom panel
│   ├── editor/               # editor tabs, Monaco wrapper
│   ├── explorer/             # file explorer
│   ├── settings/             # settings widgets
│   └── providers.tsx         # theme + react-query providers
│
├── config/                   # site, navigation, templates, roadmap, faq
├── features/                 # modular feature boundaries (future packages)
│   ├── ai/                   # agent/ models/ mcp/
│   ├── preview/              # live preview engine (Phase 3)
│   ├── flutter/              # build engine (Phase 3)
│   ├── debug/                # debug agents (Phase 4)
│   ├── agents/               # multi-agent manager (Phase 4)
│   ├── integrations/         # openrouter/ ollama/ firebase/ supabase/ github/
│   ├── plugins/              # plugin system (Phase 4)
│   └── realtime/             # websocket contract (Phase 2+)
│
├── stores/                   # Zustand stores (workspace, project, editor, ui, settings)
├── hooks/                    # reusable hooks
├── lib/                      # utils, types, api client, mock-data, db
└── prisma/                   # schema.prisma (domain model)
```

See **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** for the full architecture, **[docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)** for a per-folder explanation, and **[docs/ROADMAP.md](./docs/ROADMAP.md)** for the phased plan.

---

## 🎨 Design system

- **Accent:** emerald/teal (deliberately avoids generic blue/indigo).
- **Themes:** light & dark via `next-themes` (`class` strategy).
- **Radius:** `0.75rem` base with `sm/md/lg/xl` scales.
- **Components:** shadcn/ui (New York style) + Lucide icons.
- **Layout:** sticky status-bar footer, responsive at every breakpoint, 44px+ touch targets.

---

## 🧭 Roadmap (summary)

| Phase | Focus | Status |
|-------|-------|--------|
| **1 — Foundation** | Shell, editor, explorer, projects, settings, architecture | ✅ Active |
| **2 — AI Coding Agent** | Conversational agent, multi-model routing (OpenRouter, Ollama), MCP | 📋 Planned |
| **3 — Preview & Build** | Hot-reload web preview, Android bridge, Flutter build engine, APK builder | 📋 Planned |
| **4 — Multi-Agent & Integrations** | Debug/review agents, orchestration, GitHub/Supabase/Firebase, plugins | 📋 Planned |

Full details in **[docs/ROADMAP.md](./docs/ROADMAP.md)**.

---

## 📜 License

© FlutterForge AI. All rights reserved.
