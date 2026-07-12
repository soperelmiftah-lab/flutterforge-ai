# Roadmap

FlutterForge AI is delivered in phases. Each phase is a coherent, shippable slice, and the architecture is designed so later phases **compose** onto Phase 1 without refactors.

## Phase 1 — Foundation & Architecture ✅ Active

The foundation: a polished, production-grade workspace shell and the modular boundaries everything else plugs into.

- [x] App shell: collapsible sidebar, top bar, status bar, command palette (⌘K)
- [x] Monaco editor: tabs, unsaved indicators, custom Forge themes, ⌘S
- [x] File explorer: folder tree, expand/collapse, icons, instant filter
- [x] Project management: create, rename, delete, favorite, filter, search (mock)
- [x] Dashboard: stats, quick start, recent projects, activity, templates, roadmap
- [x] Landing page: hero, features, roadmap, pricing placeholder, FAQ, CTA
- [x] Auth pages: login & register (react-hook-form + zod, mock JWT)
- [x] Settings: theme, language, font size, editor theme, tab size, wrap, minimap, auto-save
- [x] Design system: emerald theme, dark/light, reusable components
- [x] Mock REST API: `/api/v1/{health,version,projects,workspace,settings}`
- [x] Prisma domain schema (SQLite → PostgreSQL ready)
- [x] Feature-module contracts: ai, preview, flutter, debug, agents, integrations, plugins, mcp, realtime

## Phase 2 — AI Coding Agent 📋 Planned

Make the workspace intelligent.

- [ ] Conversational AI coding agent (context-aware, project-scoped)
- [ ] Inline code suggestions & in-place file edits
- [ ] Streaming responses over WebSocket (realtime module)
- [ ] Model manager with provider routing:
  - [ ] OpenRouter adapter (multi-vendor)
  - [ ] Ollama adapter (local models)
  - [ ] Z.ai SDK integration
- [ ] AI chat session persistence (ChatSession / ChatMessage tables)
- [ ] Context bus: open files, selection, dependency graph
- [ ] Auth: NextAuth.js v4 + JWT, protected routes enforced

## Phase 3 — Live Preview & Flutter Engine 📋 Planned

See it run. Ship installable builds.

- [ ] Hot-reload web preview (Flutter web engine)
- [ ] Android device preview bridge
- [ ] Form-factor switching (phone / tablet / desktop)
- [ ] Flutter SDK provisioning & version pinning
- [ ] `flutter pub get` / `analyze` / `build` execution
- [ ] APK & appbundle builder pipeline
- [ ] Build queueing, caching, and artifact storage
- [ ] Build logs streamed to the bottom panel

## Phase 4 — Multi-Agent & Integrations 📋 Planned

Scale to teams and ecosystems.

- [ ] Debug agent: static analysis, null-safety migration, widget-tree inspection
- [ ] Code review agent: PR-style feedback before ship
- [ ] Multi-agent orchestration (Agent Manager): spawn, schedule, checkpoint
- [ ] GitHub integration: repo import/export, commits, PRs
- [ ] Supabase integration: cloud sync, auth, storage
- [ ] Firebase integration: Auth, Firestore, Storage, Crashlytics wiring for generated apps
- [ ] Plugin system: first- & third-party extensions (commands, panels, languages)
- [ ] MCP support: connect external tool servers, expose FlutterForge actions as tools

## Beyond

- Collaborative editing (CRDT)
- Marketplace for templates & plugins
- Cloud workspaces & team billing
- iOS preview & TestFlight integration

---

### How phases compose

Every Phase 2+ feature maps to an existing `src/features/*` contract. Implementation means filling in the stub bodies (and, optionally, extracting the folder to its own package) — **no changes to consumers, pages, or the shell**. That's the architectural promise of Phase 1.
