# Folder structure

A per-folder explanation of the FlutterForge AI codebase.

## `src/app/` — Next.js App Router

| Path | Purpose |
|------|---------|
| `layout.tsx` | Root layout. Mounts providers (theme, react-query), fonts, toasters. |
| `page.tsx` | Landing page (`/`). Composes marketing sections. |
| `globals.css` | Design tokens (CSS variables), theme, custom utilities. |
| `not-found.tsx` | Custom 404. |
| `(app)/layout.tsx` | Wraps protected routes in `AppShell`. |
| `(app)/dashboard/` | Dashboard page. |
| `(app)/workspace/` | The IDE surface (editor + explorer + panels). |
| `(app)/projects/` | Projects list/manage. |
| `(app)/templates/` | Template gallery. |
| `(app)/history/` | Activity timeline + chat sessions. |
| `(app)/settings/` | Settings UI. |
| `(app)/chat/` | AI chat placeholder (Phase 2). |
| `(auth)/layout.tsx` | Centered brand layout for auth pages. |
| `(auth)/login/` · `(auth)/register/` | Auth forms (react-hook-form + zod). |
| `about/` | Public about page (standalone layout). |
| `api/v1/health/` | Liveness/readiness probe. |
| `api/v1/version/` | App + capability version. |
| `api/v1/projects/` | Project collection (GET/POST) + `[id]` (GET/PATCH/DELETE). |
| `api/v1/workspace/` | Workspace state (file tree + activity). |
| `api/v1/settings/` | Settings GET/PUT. |

> **Route groups** `(app)` and `(auth)` don't affect the URL — they only group layouts.

## `src/components/`

| Folder | Contains |
|--------|----------|
| `ui/` | shadcn/ui primitives (Button, Card, Dialog, …). Pre-installed. |
| `layout/` | App shell pieces: `app-shell`, `app-sidebar`, `app-topbar`, `app-statusbar`, `command-palette`. |
| `landing/` | Marketing sections: `navbar`, `hero`, `features`, `roadmap-section`, `pricing`, `faq-section`, `cta`, `footer`. |
| `common/` | Shared building blocks: `logo`, `theme-toggle`, `page-header`, `page-container`, `empty-state`, `loading`, `status-badge`, `coming-soon`, `project-card`, `create-project-dialog`. |
| `workspace/` | `workspace-toolbar`, `right-panel` (preview/chat tabs), `bottom-panel`. |
| `editor/` | `editor-tabs`, `code-editor` (Monaco wrapper). |
| `explorer/` | `file-explorer`. |
| `providers.tsx` | Client provider mount point. |

## `src/config/` — configuration data

| File | Contents |
|------|----------|
| `site.ts` | Branding, metadata, version, links. |
| `navigation.ts` | Sidebar nav items. |
| `templates.ts` | Starter template definitions. |
| `roadmap.ts` | Phased roadmap. |
| `faq.ts` | FAQ entries. |

## `src/features/` — modular feature boundaries

Each subfolder is a **future package**. They export types + stubs only.

| Module | Future package | Responsibility |
|--------|----------------|----------------|
| `ai/agent/` | `@flutterforge/ai-agent` | Conversational coding agent |
| `ai/models/` | `@flutterforge/model-manager` | Provider routing & capability negotiation |
| `ai/mcp/` | `@flutterforge/mcp` | Model Context Protocol client |
| `preview/` | `@flutterforge/preview-engine` | Hot-reload web + Android preview |
| `flutter/` | `@flutterforge/flutter-engine` | SDK management & builds (APK, appbundle, web) |
| `debug/` | `@flutterforge/debug-engine` | Analysis, profiling, bug-fix agent |
| `agents/` | `@flutterforge/agent-manager` | Multi-agent orchestration |
| `integrations/openrouter/` | `@flutterforge/integrations-openrouter` | OpenRouter adapter |
| `integrations/ollama/` | `@flutterforge/integrations-ollama` | Ollama (local models) adapter |
| `integrations/firebase/` | `@flutterforge/integrations-firebase` | Firebase adapter |
| `integrations/supabase/` | `@flutterforge/integrations-supabase` | Supabase adapter |
| `integrations/github/` | `@flutterforge/integrations-github` | GitHub import/export |
| `plugins/` | `@flutterforge/plugin-host` | Plugin system host API |
| `realtime/` | `@flutterforge/realtime` | WebSocket/Socket.IO contract |

## `src/stores/` — Zustand stores

| File | Store |
|------|-------|
| `settings-store.ts` | `useSettingsStore` (persisted) |
| `ui-store.ts` | `useUIStore` |
| `project-store.ts` | `useProjectStore` |
| `editor-store.ts` | `useEditorStore` |
| `workspace-store.ts` | `useWorkspaceStore` |
| `index.ts` | Barrel export |

## `src/lib/` — cross-cutting utilities

| File | Contents |
|------|----------|
| `types.ts` | Shared domain types (mirror the DB schema). |
| `api.ts` | Typed API client (fetch wrapper). |
| `utils.ts` | `cn`, `timeAgo`, `colorFromString`, `initials`, `uid`. |
| `mock-data.ts` | In-memory projects, file tree, activity, chat sessions. |
| `db.ts` | Prisma client singleton. |

## `prisma/`

| File | Contents |
|------|----------|
| `schema.prisma` | Domain models: `User`, `Project`, `ProjectFile`, `Workspace`, `Settings`, `ChatSession`, `ChatMessage`. SQLite now → PostgreSQL later. |

## `docs/`

| File | Contents |
|------|----------|
| `ARCHITECTURE.md` | Layering, state, routing, module mapping. |
| `FOLDER_STRUCTURE.md` | This file. |
| `ROADMAP.md` | Phased feature plan. |

## Conventions

- **Feature-first:** group by capability, not by file type.
- **Barrel exports:** every `features/*` and `stores/*` exposes an `index.ts`.
- **No direct provider coupling:** UI imports from `features/ai`, never `features/integrations/openrouter`.
- **Server/client split:** `"use client"` only where needed (interactivity, hooks); pages stay server components by default.
- **Relative API paths only:** all `fetch` calls use `/api/v1/...`; never absolute URLs (gateway-aware).
