# Architecture

FlutterForge AI is built as a **feature-first, domain-driven** Next.js application. Every capability lives behind a module boundary so features compose instead of clashing — and so the Phase 1 foundation can absorb the AI, preview, and build engines without refactors.

## 1. High-level topology

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (client)                          │
│                                                                  │
│   ┌────────────┐   ┌──────────────┐   ┌───────────────────────┐  │
│   │ App Router  │   │  Zustand     │   │  Feature modules      │  │
│   │  (pages)    │──▶│   stores     │◀─▶│  features/*           │  │
│   └─────┬──────┘   └──────┬───────┘   └──────────┬────────────┘  │
│         │                 │                      │               │
│         │           ┌─────▼────────┐    ┌────────▼─────────┐     │
│         └──────────▶│  components/  │    │  lib/api client   │     │
│                     │  (UI + layout)│    └────────┬──────────┘     │
│                     └──────────────┘             │                │
└──────────────────────────────────────────────────┼────────────────┘
                                                   │ relative fetch
┌──────────────────────────────────────────────────▼────────────────┐
│                      Next.js server (port 3000)                    │
│   ┌──────────────────────────────────────────────────────────┐    │
│   │  /api/v1/*  (Route Handlers — mock REST in Phase 1)       │    │
│   └────────────────────────┬─────────────────────────────────┘    │
│                            │ Prisma Client                         │
│                   ┌────────▼─────────┐                             │
│                   │   SQLite (file)   │  → PostgreSQL in prod      │
│                   └──────────────────┘                             │
└────────────────────────────────────────────────────────────────────┘

            (Phase 2+)  Mini-service on port 3003  ◀── Socket.IO realtime
```

## 2. Layering rules (non-negotiable)

1. **Pages** (`app/**`) only orchestrate. They compose components and read/write stores. No business logic.
2. **Components** (`components/**`) are presentational. They may read stores but never call the API directly — that's the store's job.
3. **Stores** (`stores/**`) own client state and are the single mutation surface. Each store hydrates from `lib/mock-data` (Phase 1) or `lib/api` (Phase 2+).
4. **Feature modules** (`features/**`) expose **contracts** (types + stubs). UI depends on the barrel, never on a provider implementation.
5. **API routes** (`app/api/v1/**`) are the backend boundary. They return typed JSON matching `lib/types.ts`.
6. **lib/** holds cross-cutting utilities: `types.ts`, `api.ts`, `utils.ts`, `mock-data.ts`, `db.ts`.

## 3. State management

| Store | Responsibility | Persisted? |
|-------|----------------|-----------|
| `settings-store` | Theme, editor config, language | ✅ localStorage |
| `ui-store` | Sidebar collapse, panels, command palette, mobile nav | ❌ |
| `project-store` | Project collection + CRUD | ❌ (mock) |
| `editor-store` | File tree, open tabs, dirty state | ❌ (mock) |
| `workspace-store` | Activity feed, chat sessions, active project | ❌ (mock) |

Each store is a standalone Zustand slice. They're composed via `@/stores` barrel so feature code stays decoupled from file paths.

## 4. Routing & route groups

- `(app)/` — protected routes rendered inside `AppShell` (sidebar + topbar + status bar). Auth guard wired in Phase 2.
- `(auth)/` — public login/register with a minimal brand layout.
- `about/` — public, standalone layout.
- `not-found.tsx` — custom 404 at the root.

## 5. The editor pipeline

```
FileExplorer ──openFile(id)──▶ editor-store ──tabs/activeTabId──▶ EditorTabs
                                                                  │
                                                                  ▼
                                                              CodeEditor (Monaco)
                                                                  │ onChange
                                                                  ▼
                                                          editor-store.updateContent
                                                                  │ marks dirty
                                                                  ▼
                                                              StatusBadge + floating Save
```

- Monaco is lazy-loaded by `@monaco-editor/react`.
- Two custom themes (`forge-dark`, `forge-light`) are registered on mount.
- ⌘S saves the active tab; the toolbar's Save button saves all dirty tabs.
- Editor config (font size, wrap, minimap, line numbers, tab size) is read live from `settings-store`.

## 6. Feature-module → future-package mapping

The brief specified a `packages/` monorepo. Phase 1 keeps everything in one Next.js app for fast iteration, but the `src/features/*` folders are the **future packages** — extraction is mechanical:

| `src/features/` | Future package | Phase |
|------------------|----------------|-------|
| `ai/agent` | `@flutterforge/ai-agent` | 2 |
| `ai/models` | `@flutterforge/model-manager` | 2 |
| `ai/mcp` | `@flutterforge/mcp` | 4 |
| `preview` | `@flutterforge/preview-engine` | 3 |
| `flutter` | `@flutterforge/flutter-engine` | 3 |
| `debug` | `@flutterforge/debug-engine` | 4 |
| `agents` | `@flutterforge/agent-manager` | 4 |
| `integrations/*` | `@flutterforge/integrations-*` | 2–4 |
| `plugins` | `@flutterforge/plugin-host` | 4 |
| `realtime` | `@flutterforge/realtime` | 2+ |

Each module exports **only types + stubs** today. When a phase implements it, the stub bodies are filled in and (optionally) the folder is extracted to its own package without touching consumers.

## 7. Realtime (WebSocket) contract

Defined in `features/realtime`. Phase 1 ships a no-op client + the canonical event names. When implemented:

- A Socket.IO mini-service runs on **port 3003**.
- The browser connects via the gateway: `io("/?XTransformPort=3003")` (relative path, never a direct localhost URL).
- Namespaces: `/projects`, `/agents`, `/builds`, `/preview`.
- Event names live in `realtimeEvents` so client & server cannot drift.

## 8. Data model

See `prisma/schema.prisma`. Phase 1 uses SQLite (zero-config); the schema is provider-agnostic and migrates to PostgreSQL by changing the `datasource` provider.

```
User ─┬─< Project ─< ProjectFile
      │            └─ Workspace (1:1)
      ├─ Settings (1:1)
      └─< ChatSession ─< ChatMessage
```

## 9. Theming

- Tokens in `app/globals.css` (CSS variables, oklch color space).
- `next-themes` toggles `.dark` on `<html>`.
- Accent: emerald (`oklch(0.62 0.15 162)`) — chosen for a fresh "forge/build" feel while avoiding the overused blue/indigo.
- Custom utilities: `.ff-grid-bg` (ambient grid), `.ff-glow` (hero glow), `.ff-pulse` (status ping), `.ff-scroll` (thin IDE scrollbars).

## 10. Accessibility & responsiveness

- Semantic landmarks (`header`, `nav`, `main`, `footer`).
- Keyboard-navigable: command palette (⌘K), tab close, panel toggles.
- Mobile-first: sidebar collapses to a Sheet on `<md`, panel toggles hide on `<lg`.
- 44px+ touch targets on interactive elements.
- Sticky status-bar footer that pins to the viewport on short content and pushes down on long content (`h-screen flex flex-col` shell + `mt-auto`-equivalent flex layout).
